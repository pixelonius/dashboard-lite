/**
 * Home page metric calculations
 */

import { prisma } from '../lib/prisma';
import type { DateRange } from '../utils/date';
import { formatDate } from '../utils/date';
import type { HomeCardsResponse, CashBySourceItem, Transaction, MetricBreakdown } from '../types/api';
import { PaymentStatus, EnrollmentStatus, InstallmentStatus, TeamMemberRole } from '@prisma/client';

/**
 * Calculate all homepage cards metrics
 */
export async function calculateHomeCards(range: DateRange): Promise<HomeCardsResponse> {
  const { from, to } = range;

  // Parallel queries for all metrics
  const [
    netRevenue,
    newCustomers,
    closedWonRevenue,
    leadsCaptured,
    adSpend,
    overduePayments,
    refunds,
  ] = await Promise.all([
    // Net Revenue (Cash Collected)
    prisma.payment.aggregate({
      where: {
        date: { gte: from, lte: to },
        status: PaymentStatus.PAID,
      },
      _sum: { amount: true },
    }),

    // New Customers (Students with enrollments starting in range)
    prisma.student.count({
      where: {
        enrollments: {
          some: {
            startDate: { gte: from, lte: to },
          },
        },
      },
    }),

    // Closed-Won Revenue (Contracted Value of new enrollments)
    prisma.enrollment.findMany({
      where: {
        startDate: { gte: from, lte: to },
        status: { not: EnrollmentStatus.DROPPED },
      },
      include: {
        program: true,
      },
    }),

    // Leads Captured
    prisma.lead.count({
      where: {
        createdAt: { gte: from, lte: to },
      },
    }),

    // Ad Spend
    prisma.adPerformance.aggregate({
      where: {
        date: { gte: from, lte: to },
      },
      _sum: { spend: true },
    }),

    // Overdue Payments
    prisma.installment.aggregate({
      where: {
        status: InstallmentStatus.OVERDUE,
      },
      _sum: { amount: true },
      _count: true,
    }),

    // Refunds
    prisma.payment.aggregate({
      where: {
        date: { gte: from, lte: to },
        status: PaymentStatus.REFUNDED,
      },
      _sum: { amount: true },
    }),
  ]);

  // Calculate total contracted value
  const totalContractedValue = closedWonRevenue.reduce(
    (sum, enrollment) => sum + Number(enrollment.program.price),
    0
  );

  return {
    netRevenue: Number(netRevenue._sum.amount || 0),
    newCustomers: newCustomers,
    closedWonRevenue: totalContractedValue,
    leadsCaptured: leadsCaptured,
    adSpend: Number(adSpend._sum.spend || 0),
    contentViews: { amount: 0, implemented: false },
    overduePayments: {
      count: overduePayments._count,
      total: Number(overduePayments._sum.amount || 0),
    },
    refunds: { amount: Number(refunds._sum.amount || 0) },
    email: { implemented: false },
  };
}

/**
 * Get cash collected by source
 */
export async function getCashCollectedBySource(range: DateRange): Promise<CashBySourceItem[]> {
  const { from, to } = range;

  // Get payments with student/lead info to determine source
  // Since source is on Lead, we need to join: Payment -> Enrollment -> Student -> (Match Lead by Email)
  // This is complex in Prisma without direct relation. 
  // For now, we'll fetch payments and try to map them.

  const payments = await prisma.payment.findMany({
    where: {
      date: { gte: from, lte: to },
      status: PaymentStatus.PAID,
    },
    include: {
      enrollment: {
        include: {
          student: true,
        },
      },
    },
  });

  // Get all leads to map emails to sources
  // Optimization: Collect emails first
  const emails = payments.map(p => p.enrollment.student.email);
  const leads = await prisma.lead.findMany({
    where: {
      email: { in: emails },
    },
    select: {
      email: true,
      source: true,
    },
  });

  const emailSourceMap = new Map(leads.map(l => [l.email, l.source || 'Unknown']));
  const totals = new Map<string, number>();

  for (const payment of payments) {
    const email = payment.enrollment.student.email;
    const source = emailSourceMap.get(email) || 'Direct/Unknown';
    const amount = Number(payment.amount);

    totals.set(source, (totals.get(source) || 0) + amount);
  }

  return Array.from(totals.entries()).map(([source, amount]) => ({
    source,
    amount,
  }));
}

/**
 * Get aggregated metrics for Home Pie Charts
 */
export async function getHomePieCharts(range: DateRange) {
  const { from, to } = range;

  // 1. Closers (Closed Calls -> Closes)
  const closersData = await prisma.dailyMetric.groupBy({
    by: ['teamMemberId'],
    where: {
      date: { gte: from, lte: to },
      teamMember: { role: TeamMemberRole.CLOSER },
    },
    _sum: { closes: true },
  });

  // 2. Setters (Calls Made)
  const settersData = await prisma.dailyMetric.groupBy({
    by: ['teamMemberId'],
    where: {
      date: { gte: from, lte: to },
      teamMember: { role: TeamMemberRole.SETTER },
    },
    _sum: { callsMade: true },
  });

  // 3. DM Setters (DM Sent)
  const dmSettersData = await prisma.dailyMetric.groupBy({
    by: ['teamMemberId'],
    where: {
      date: { gte: from, lte: to },
      teamMember: { role: TeamMemberRole.DM_SETTER },
    },
    _sum: { dmsSent: true },
  });

  // Fetch all team members to map names
  const allIds = new Set([
    ...closersData.map(d => d.teamMemberId),
    ...settersData.map(d => d.teamMemberId),
    ...dmSettersData.map(d => d.teamMemberId),
  ]);

  const teamMembers = await prisma.teamMember.findMany({
    where: { id: { in: Array.from(allIds) } },
    select: { id: true, firstName: true, lastName: true },
  });

  const memberMap = new Map(teamMembers.map(m => [m.id, `${m.firstName} ${m.lastName}`]));

  const mapToBreakdown = (data: any[], valueKey: string): MetricBreakdown[] => {
    return data
      .map(item => ({
        name: memberMap.get(item.teamMemberId) || 'Unknown',
        value: Number(item._sum[valueKey] || 0),
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  return {
    closedCallsByCloser: mapToBreakdown(closersData, 'closes'),
    callsMadeBySetter: mapToBreakdown(settersData, 'callsMade'),
    dmsSentByDmSetter: mapToBreakdown(dmSettersData, 'dmsSent'),
  };
}

/**
 * Get recent transactions with pagination
 */
export async function getRecentTransactions(
  range: DateRange,
  page: number = 1,
  limit: number = 10
): Promise<{ transactions: Transaction[]; total: number }> {
  const { from, to } = range;
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: {
        date: { gte: from, lte: to },
        status: { in: [PaymentStatus.PAID, PaymentStatus.REFUNDED] },
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip,
      include: {
        enrollment: {
          include: {
            student: true,
            program: true,
          },
        },
      },
    }),
    prisma.payment.count({
      where: {
        date: { gte: from, lte: to },
        status: { in: [PaymentStatus.PAID, PaymentStatus.REFUNDED] },
      },
    }),
  ]);

  // We need sources for these transactions too
  const emails = payments.map(p => p.enrollment.student.email);
  const leads = await prisma.lead.findMany({
    where: { email: { in: emails } },
    select: { email: true, source: true },
  });
  const emailSourceMap = new Map(leads.map(l => [l.email, l.source || 'Unknown']));

  const transactions: Transaction[] = payments.map(payment => ({
    date: formatDate(payment.date),
    name: `${payment.enrollment.student.firstName} ${payment.enrollment.student.lastName}`,
    value: Number(payment.amount) * (payment.status === PaymentStatus.REFUNDED ? -1 : 1),
    source: emailSourceMap.get(payment.enrollment.student.email) || 'Unknown',
    lineOfBusiness: payment.enrollment.program.name,
  }));

  return { transactions, total };
}
