/**
 * Sales page metric calculations
 */

import { prisma } from '../lib/prisma';
import type { DateRange } from '../utils/date';
import {
  getDaysBetween,
  getDaysInCurrentMonth,
  getStartOfMonth,
  formatDate,
} from '../utils/date';
import type {
  SalesTopCardsResponse,
  ClosersMetricsResponse,
  CloserPerformance,
  PaymentRow,
  SettersMetricsResponse,
  SetterPerformance,
  DmSettersMetricsResponse,
  DmSetterPerformance,
} from '../types/api';
import { TeamMemberRole } from '@prisma/client';

/**
 * Calculate top cards for sales page (visible on all tabs)
 */
export async function calculateSalesTopCards(range: DateRange): Promise<SalesTopCardsResponse> {
  const { from, to } = range;

  // Aggregate metrics from DailyMetric table across all team members
  const metrics = await prisma.dailyMetric.aggregate({
    where: {
      date: { gte: from, lte: to },
    },
    _sum: {
      booked: true,
      calls: true, // outbound dials (setters)
      conversations: true, // pickups (setters) or dms (dm setters)?
      offers: true,
      closes: true,
      cash: true,
    },
  });

  // For specific breakdown, we might need to filter by role, but DailyMetric aggregates everything.
  // Let's refine based on roles if needed, but for top cards "Total Booked Calls" usually implies all booked.

  // Cash Collected from Payments (Source of Truth)
  const cashCollected = await prisma.payment.aggregate({
    where: { date: { gte: from, lte: to }, status: 'PAID' },
    _sum: { amount: true },
  });

  // New Students (Enrollments starting in range)
  const newStudents = await prisma.enrollment.count({
    where: {
      startDate: { gte: from, lte: to },
      status: 'ACTIVE',
    },
  });

  // Calculate specific metrics
  // We need to distinguish between Closer metrics (Live Calls, Offers) and Setter metrics (Calls Made, Pickups)
  // DailyMetric is generic. We should join with TeamMember to filter by role.

  const closersMetrics = await prisma.dailyMetric.aggregate({
    where: {
      date: { gte: from, lte: to },
      teamMember: { role: 'CLOSER' },
    },
    _sum: {
      booked: true, // Total Booked Calls? Usually Setters book them.
      conversations: true, // Live Calls for Closers?
      offers: true,
      closes: true,
    },
  });

  const settersMetrics = await prisma.dailyMetric.aggregate({
    where: {
      date: { gte: from, lte: to },
      teamMember: { role: 'SETTER' },
    },
    _sum: {
      calls: true, // Outbound Dials
      conversations: true, // Pickups
      booked: true, // Sets Booked
    },
  });

  const dmSettersMetrics = await prisma.dailyMetric.aggregate({
    where: {
      date: { gte: from, lte: to },
      teamMember: { role: 'DM_SETTER' },
    },
    _sum: {
      calls: true, // DMs Sent?
      booked: true, // Sets Booked
    },
  });

  // Mapping DailyMetric fields to business logic:
  // Closers: conversations -> Live Calls
  // Setters: calls -> Outbound Dials, conversations -> Pickups
  // DM Setters: calls -> DMs Sent

  const totalBookedCalls = (Number(settersMetrics._sum.booked || 0) + Number(dmSettersMetrics._sum.booked || 0));
  const liveCalls = Number(closersMetrics._sum.conversations || 0);
  const offersMade = Number(closersMetrics._sum.offers || 0);
  const cashCollectedAmount = Number(cashCollected._sum.amount || 0);

  // Calls on Calendar (Future)
  const callsOnCalendar = await prisma.salesCall.count({
    where: {
      startTime: { gte: new Date() },
      status: 'SCHEDULED',
    },
  });

  // Calculate company monthly pacing
  const daysInRange = getDaysBetween(from, to);
  const daysInMonth = getDaysInCurrentMonth();
  const avgCashPerDay = daysInRange > 0 ? cashCollectedAmount / daysInRange : 0;
  const companyMonthlyPacing = avgCashPerDay * daysInMonth;

  return {
    totalBookedCalls,
    cashCollected: cashCollectedAmount,
    liveCalls,
    offersMade,
    showUpRate: totalBookedCalls > 0 ? liveCalls / totalBookedCalls : 0, // Approx
    outboundDials: Number(settersMetrics._sum.calls || 0),
    dmsSent: Number(dmSettersMetrics._sum.calls || 0),
    pickups: Number(settersMetrics._sum.conversations || 0),
    newStudents,
    companyMonthlyPacing,
  };
}

/**
 * Calculate Closers tab metrics
 */
export async function calculateClosersMetrics(
  range: DateRange,
  member?: string
): Promise<ClosersMetricsResponse> {
  const { from, to } = range;

  // Filter by member if provided
  let teamMemberId: number | undefined;
  if (member) {
    const [firstName, ...lastNameParts] = member.split(' ');
    const lastName = lastNameParts.join(' ');
    const tm = await prisma.teamMember.findFirst({
      where: { firstName, lastName, role: 'CLOSER' },
    });
    teamMemberId = tm?.id;
  }

  const whereMetric = {
    date: { gte: from, lte: to },
    teamMember: {
      role: TeamMemberRole.CLOSER,
      ...(teamMemberId ? { id: teamMemberId } : {}),
    },
  };

  const metrics = await prisma.dailyMetric.aggregate({
    where: whereMetric,
    _sum: {
      conversations: true, // Live Calls
      offers: true,
      closes: true,
    },
  });

  const liveCalls = Number(metrics._sum.conversations || 0);
  const offersMade = Number(metrics._sum.offers || 0);
  const closes = Number(metrics._sum.closes || 0);

  // Cash
  const cashData = await getCloserCash(from, to, teamMemberId);

  // Calls on Calendar
  const callsOnCalendar = await prisma.salesCall.count({
    where: {
      startTime: { gte: new Date() },
      status: 'SCHEDULED',
      ...(teamMemberId ? { hostId: teamMemberId } : {}),
    },
  });

  // Total Booked Calls (assigned to closers)
  // This is tricky if we don't track assignment on booking. 
  // We'll assume total booked calls for the company or just use live calls as proxy for now if unavailable.
  // Or query SalesCalls in range.
  const totalBookedCalls = await prisma.salesCall.count({
    where: {
      startTime: { gte: from, lte: to },
      ...(teamMemberId ? { hostId: teamMemberId } : {}),
    },
  });

  const daysInRange = getDaysBetween(from, to);
  const avgCashPerDay = daysInRange > 0 ? cashData.total / daysInRange : 0;

  return {
    totalBookedCalls,
    liveCalls,
    closes,
    offersMade,
    offerRate: liveCalls > 0 ? offersMade / liveCalls : 0,
    offerToCloseRate: offersMade > 0 ? closes / offersMade : 0,
    closeRate: liveCalls > 0 ? closes / liveCalls : 0,
    cashPerLiveCall: liveCalls > 0 ? cashData.total / liveCalls : 0,
    avgCashPerDay,
    closedWonRevenueMTD: cashData.total,
    callsOnCalendar,
  };
}

/**
 * Get closer performance breakdown
 */
export async function getCloserPerformance(range: DateRange): Promise<CloserPerformance[]> {
  const { from, to } = range;

  // Group DailyMetrics by TeamMember
  const metrics = await prisma.dailyMetric.groupBy({
    by: ['teamMemberId'],
    where: {
      date: { gte: from, lte: to },
      teamMember: { role: 'CLOSER' },
    },
    _sum: {
      conversations: true, // Live Calls
      offers: true,
      closes: true,
    },
  });

  // Get TeamMember details
  const memberIds = metrics.map(m => m.teamMemberId);
  const members = await prisma.teamMember.findMany({
    where: { id: { in: memberIds } },
  });
  const memberMap = new Map(members.map(m => [m.id, m]));

  // Get Cash by Closer
  // We need to aggregate payments by closer
  const payments = await prisma.payment.findMany({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
      enrollment: { closerId: { in: memberIds } },
    },
    include: { enrollment: true },
  });

  const cashByCloser = new Map<number, number>();
  for (const p of payments) {
    const cid = p.enrollment.closerId;
    if (cid) {
      cashByCloser.set(cid, (cashByCloser.get(cid) || 0) + Number(p.amount));
    }
  }

  // Calls on Calendar by Closer
  const callsOnCalendar = await prisma.salesCall.groupBy({
    by: ['hostId'],
    where: {
      startTime: { gte: new Date() },
      status: 'SCHEDULED',
      hostId: { in: memberIds },
    },
    _count: { id: true },
  });
  const calendarMap = new Map(callsOnCalendar.map(c => [c.hostId, c._count.id]));

  return metrics.map(m => {
    const member = memberMap.get(m.teamMemberId);
    const name = member ? `${member.firstName} ${member.lastName}` : 'Unknown';
    const liveCalls = Number(m._sum.conversations || 0);
    const offersMade = Number(m._sum.offers || 0);
    const closes = Number(m._sum.closes || 0);
    const ccByRep = cashByCloser.get(m.teamMemberId) || 0;

    return {
      rep: name,
      liveCalls,
      closes,
      callsOnCalendar: calendarMap.get(m.teamMemberId) || 0,
      offerToClosePct: offersMade > 0 ? closes / offersMade : 0,
      closePct: liveCalls > 0 ? closes / liveCalls : 0,
      ccPerLiveCall: liveCalls > 0 ? ccByRep / liveCalls : 0,
      ccByRep,
    };
  }).sort((a, b) => b.liveCalls - a.liveCalls);
}

/**
 * Get payments table for closers
 */
export async function getCloserPayments(range: DateRange): Promise<PaymentRow[]> {
  const { from, to } = range;

  const payments = await prisma.payment.findMany({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
    },
    include: {
      enrollment: {
        include: {
          closer: true,
          setter: true,
          student: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  return payments.map(p => ({
    id: p.id,
    date: formatDate(p.date),
    name: p.enrollment.student.firstName + ' ' + p.enrollment.student.lastName,
    cc: Number(p.amount),
    closer: p.enrollment.closer ? `${p.enrollment.closer.firstName} ${p.enrollment.closer.lastName}` : 'Unassigned',
    setter: p.enrollment.setter ? `${p.enrollment.setter.firstName} ${p.enrollment.setter.lastName}` : 'Unassigned',
    assignedCloserId: p.enrollment.closerId,
    assignedSetterId: p.enrollment.setterId,
  }));
}

/**
 * Calculate Setters tab metrics
 */
export async function calculateSettersMetrics(
  range: DateRange,
  member?: string
): Promise<SettersMetricsResponse> {
  const { from, to } = range;

  let teamMemberId: number | undefined;
  if (member) {
    const [firstName, ...lastNameParts] = member.split(' ');
    const lastName = lastNameParts.join(' ');
    const tm = await prisma.teamMember.findFirst({
      where: { firstName, lastName, role: 'SETTER' },
    });
    teamMemberId = tm?.id;
  }

  const whereMetric = {
    date: { gte: from, lte: to },
    teamMember: {
      role: TeamMemberRole.SETTER,
      ...(teamMemberId ? { id: teamMemberId } : {}),
    },
  };

  const metrics = await prisma.dailyMetric.aggregate({
    where: whereMetric,
    _sum: {
      calls: true, // Outbound Dials
      conversations: true, // Pickups
      booked: true, // Booked Calls
      closes: true, // Closed Won (attributed to setter)
    },
  });

  const outboundDials = Number(metrics._sum.calls || 0);
  const pickUps = Number(metrics._sum.conversations || 0);
  const bookedCalls = Number(metrics._sum.booked || 0);
  const closedWon = Number(metrics._sum.closes || 0);

  // Cash Collected (Attributed to Setters)
  const payments = await prisma.payment.aggregate({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
      enrollment: {
        setter: {
          role: 'SETTER',
          ...(teamMemberId ? { id: teamMemberId } : {}),
        },
      },
    },
    _sum: { amount: true },
  });
  const cashCollected = Number(payments._sum.amount || 0);

  const daysInRange = getDaysBetween(from, to);
  const daysInMonth = getDaysInCurrentMonth();
  const cashPerDay = daysInRange > 0 ? cashCollected / daysInRange : 0;
  const monthlyPacing = cashPerDay * daysInMonth;

  return {
    outboundDials,
    pickUps,
    bookedCalls,
    reschedules: 0, // Not tracked in DailyMetric currently
    closedWon,
    cashCollected,
    pickUpToBookedPct: pickUps > 0 ? bookedCalls / pickUps : 0,
    cashPerDay,
    cashPerBookedCall: bookedCalls > 0 ? cashCollected / bookedCalls : 0,
    monthlyPacing,
  };
}

/**
 * Get setter performance breakdown
 */
export async function getSetterPerformance(range: DateRange): Promise<SetterPerformance[]> {
  const { from, to } = range;

  const metrics = await prisma.dailyMetric.groupBy({
    by: ['teamMemberId'],
    where: {
      date: { gte: from, lte: to },
      teamMember: { role: 'SETTER' },
    },
    _sum: {
      calls: true,
      conversations: true,
      booked: true,
      closes: true,
    },
  });

  const memberIds = metrics.map(m => m.teamMemberId);
  const members = await prisma.teamMember.findMany({
    where: { id: { in: memberIds } },
  });
  const memberMap = new Map(members.map(m => [m.id, m]));

  // Cash by Setter
  const payments = await prisma.payment.findMany({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
      enrollment: { setterId: { in: memberIds } },
    },
    include: { enrollment: true },
  });

  const cashBySetter = new Map<number, number>();
  for (const p of payments) {
    const sid = p.enrollment.setterId;
    if (sid) {
      cashBySetter.set(sid, (cashBySetter.get(sid) || 0) + Number(p.amount));
    }
  }

  return metrics.map(m => {
    const member = memberMap.get(m.teamMemberId);
    const name = member ? `${member.firstName} ${member.lastName}` : 'Unknown';

    return {
      rep: name,
      callsMade: Number(m._sum.calls || 0),
      pickUps: Number(m._sum.conversations || 0),
      bookedCalls: Number(m._sum.booked || 0),
      closedWon: Number(m._sum.closes || 0),
      ccBySetter: cashBySetter.get(m.teamMemberId) || 0,
    };
  }).sort((a, b) => b.bookedCalls - a.bookedCalls);
}

/**
 * Calculate DM Setters tab metrics
 */
export async function calculateDmSettersMetrics(
  range: DateRange,
  member?: string
): Promise<DmSettersMetricsResponse> {
  const { from, to } = range;

  let teamMemberId: number | undefined;
  if (member) {
    const [firstName, ...lastNameParts] = member.split(' ');
    const lastName = lastNameParts.join(' ');
    const tm = await prisma.teamMember.findFirst({
      where: { firstName, lastName, role: 'DM_SETTER' },
    });
    teamMemberId = tm?.id;
  }

  const whereMetric = {
    date: { gte: from, lte: to },
    teamMember: {
      role: TeamMemberRole.DM_SETTER,
      ...(teamMemberId ? { id: teamMemberId } : {}),
    },
  };

  const metrics = await prisma.dailyMetric.aggregate({
    where: whereMetric,
    _sum: {
      calls: true, // DMs Sent
      conversations: true, // Responses
      booked: true, // Booked Calls
      closes: true, // Closed Won
    },
  });

  const dmsOutbound = Number(metrics._sum.calls || 0);
  const outboundResponses = Number(metrics._sum.conversations || 0);
  const bookedCalls = Number(metrics._sum.booked || 0);
  const closedWon = Number(metrics._sum.closes || 0);

  // Cash Collected
  const payments = await prisma.payment.aggregate({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
      enrollment: {
        setter: {
          role: 'DM_SETTER',
          ...(teamMemberId ? { id: teamMemberId } : {}),
        },
      },
    },
    _sum: { amount: true },
  });
  const cashCollected = Number(payments._sum.amount || 0);

  const daysInRange = getDaysBetween(from, to);
  const cashPerDay = daysInRange > 0 ? cashCollected / daysInRange : 0;

  return {
    dmsOutbound,
    dmsInbound: 0, // Not tracked
    bookedCalls,
    followUps: 0, // Not tracked
    setsTaken: 0, // Not tracked
    closedWon,
    cashCollected,
    conversationRate: dmsOutbound > 0 ? outboundResponses / dmsOutbound : 0,
    bookingRate: outboundResponses > 0 ? bookedCalls / outboundResponses : 0,
    cashPerDay,
    cashPerBookedCall: bookedCalls > 0 ? cashCollected / bookedCalls : 0,
  };
}

/**
 * Get DM setter performance breakdown
 */
export async function getDmSetterPerformance(range: DateRange): Promise<DmSetterPerformance[]> {
  const { from, to } = range;

  const metrics = await prisma.dailyMetric.groupBy({
    by: ['teamMemberId'],
    where: {
      date: { gte: from, lte: to },
      teamMember: { role: 'DM_SETTER' },
    },
    _sum: {
      calls: true,
      conversations: true,
      booked: true,
      closes: true,
    },
  });

  const memberIds = metrics.map(m => m.teamMemberId);
  const members = await prisma.teamMember.findMany({
    where: { id: { in: memberIds } },
  });
  const memberMap = new Map(members.map(m => [m.id, m]));

  // Cash by DM Setter
  const payments = await prisma.payment.findMany({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
      enrollment: { setterId: { in: memberIds } },
    },
    include: { enrollment: true },
  });

  const cashBySetter = new Map<number, number>();
  for (const p of payments) {
    const sid = p.enrollment.setterId;
    if (sid) {
      cashBySetter.set(sid, (cashBySetter.get(sid) || 0) + Number(p.amount));
    }
  }

  return metrics.map(m => {
    const member = memberMap.get(m.teamMemberId);
    const name = member ? `${member.firstName} ${member.lastName}` : 'Unknown';

    return {
      rep: name,
      newOutboundConvos: Number(m._sum.calls || 0),
      outboundResponses: Number(m._sum.conversations || 0),
      totalCallsBooked: Number(m._sum.booked || 0),
      closedWon: Number(m._sum.closes || 0),
      ccByDmSetter: cashBySetter.get(m.teamMemberId) || 0,
    };
  }).sort((a, b) => b.totalCallsBooked - a.totalCallsBooked);
}

// ========== HELPER FUNCTIONS ==========

/**
 * Get cash collected for closer (filtered by member if provided)
 */
async function getCloserCash(
  from: Date,
  to: Date,
  closerId?: number
): Promise<{ total: number; mtd: number }> {
  const monthStart = getStartOfMonth(new Date());

  const whereBase = {
    date: { gte: from, lte: to },
    status: 'PAID' as const,
    enrollment: {
      ...(closerId ? { closerId } : {}),
    },
  };

  const whereMtd = {
    date: { gte: monthStart, lte: to },
    status: 'PAID' as const,
    enrollment: {
      ...(closerId ? { closerId } : {}),
    },
  };

  const [total, mtd] = await Promise.all([
    prisma.payment.aggregate({
      where: whereBase,
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: whereMtd,
      _sum: { amount: true },
    }),
  ]);

  return {
    total: Number(total._sum.amount || 0),
    mtd: Number(mtd._sum.amount || 0),
  };
}
