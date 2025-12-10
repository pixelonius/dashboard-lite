import { prisma } from '../lib/prisma';
import { Prisma, TeamMemberRole } from '@prisma/client';
import {
  SalesTopCardsResponse,
  ClosersMetricsResponse,
  CloserPerformance,
  PaymentRow,
  SettersMetricsResponse,
  SetterPerformance,
  DmSettersMetricsResponse,
  DmSetterPerformance,
} from '../types/api';
import {
  getDaysBetween,
  getDaysInCurrentMonth,
  getStartOfMonth,
  formatDate,
  DateRange,
} from '../utils/date';

/**
 * Calculate Sales Top Cards
 */
export async function calculateSalesTopCards(range: DateRange): Promise<SalesTopCardsResponse> {
  const { from, to } = range;

  const closersMetrics = await prisma.dailyMetric.aggregate({
    where: {
      date: { gte: from, lte: to },
      teamMember: { role: TeamMemberRole.CLOSER },
    },
    _sum: {
      liveCalls: true,
      offersMade: true,
      closes: true,
    },
  });

  const settersMetrics = await prisma.dailyMetric.aggregate({
    where: {
      date: { gte: from, lte: to },
      teamMember: { role: TeamMemberRole.SETTER },
    },
    _sum: {
      callsMade: true, // Outbound Dials
      liveCalls: true, // Pickups
      bookedCalls: true, // Sets Booked
    },
  });

  const dmSettersMetrics = await prisma.dailyMetric.aggregate({
    where: {
      date: { gte: from, lte: to },
      teamMember: { role: TeamMemberRole.DM_SETTER },
    },
    _sum: {
      dmsSent: true,
      bookedCalls: true,
    },
  });

  const cashCollected = await prisma.payment.aggregate({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
    },
    _sum: { amount: true },
  });

  // Mapping DailyMetric fields to business logic:
  // Using 'as any' for _sum properties if strict typing fails due to client generation issues
  const smSum = settersMetrics._sum as any;
  const dmSum = dmSettersMetrics._sum as any;
  const cmSum = closersMetrics._sum as any;

  const totalBookedCalls = (Number(smSum.bookedCalls || 0) + Number(dmSum.bookedCalls || 0));
  const liveCalls = Number(cmSum.liveCalls || 0);
  const offersMade = Number(cmSum.offersMade || 0);
  const cashCollectedAmount = Number(cashCollected._sum.amount || 0);

  // New Students: Count from Student table based on creation date
  const newStudents = await prisma.student.count({
    where: {
      createdAt: { gte: from, lte: to },
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
    outboundDials: Number(smSum.callsMade || 0),
    dmsSent: Number(dmSum.dmsSent || 0),
    pickups: Number(smSum.liveCalls || 0),
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
      where: { firstName, lastName, role: TeamMemberRole.CLOSER },
    });
    teamMemberId = tm?.id;
  }

  const whereMetric: Prisma.DailyMetricWhereInput = {
    date: { gte: from, lte: to },
    teamMember: {
      role: TeamMemberRole.CLOSER,
    },
  };

  if (teamMemberId) {
    whereMetric.teamMember = {
      ...(whereMetric.teamMember as Prisma.TeamMemberWhereInput),
      id: teamMemberId,
    };
  }

  const metrics = await prisma.dailyMetric.aggregate({
    where: whereMetric,
    _sum: {
      liveCalls: true,
      offersMade: true,
      closes: true,
      scheduledCalls: true, // For Total Booked Calls
      reschedules: true,
      cashCollected: true, // Reported Revenue from EOD cash collected
    },
  });

  const mSum = metrics._sum as any;
  const liveCalls = Number(mSum.liveCalls || 0);
  const offersMade = Number(mSum.offersMade || 0);
  const closes = Number(mSum.closes || 0);
  const totalBookedCalls = Number(mSum.scheduledCalls || 0);
  //const reschedules = Number(mSum.reschedules || 0);
  const reportedRevenue = Number(mSum.cashCollected || 0);

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

  // Cash Collected (Actual)
  const cashCollected = cashData.total;

  const daysInRange = getDaysBetween(from, to);
  const avgCashPerDay = daysInRange > 0 ? cashCollected / daysInRange : 0;

  return {
    totalBookedCalls,
    liveCalls,
    closes,
    offersMade,
    offerRate: liveCalls > 0 ? offersMade / liveCalls : 0,
    offerToCloseRate: offersMade > 0 ? closes / offersMade : 0,
    closeRate: liveCalls > 0 ? closes / liveCalls : 0,
    cashPerLiveCall: liveCalls > 0 ? cashCollected / liveCalls : 0,
    avgCashPerDay,
    closedWonRevenueMTD: cashCollected,
    callsOnCalendar,
    reportedRevenue,
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
      teamMember: { role: TeamMemberRole.CLOSER },
    },
    _sum: {
      liveCalls: true,
      offersMade: true,
      closes: true,
      reschedules: true,
      cashCollected: true,
    },
  });

  // Get TeamMember details
  const memberIds = metrics.map(m => m.teamMemberId);
  const members = await prisma.teamMember.findMany({
    where: { id: { in: memberIds } },
  });
  const memberMap = new Map(members.map(m => [m.id, m]));

  // Get Cash by Closer
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
    const mSum = m._sum as any;
    const liveCalls = Number(mSum.liveCalls || 0);
    const offersMade = Number(mSum.offersMade || 0);
    const closes = Number(mSum.closes || 0);
    //const reschedules = Number(mSum.reschedules || 0);
    const reportedRevenue = Number(mSum.cashCollected || 0);
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
      //reschedules,
      reportedRevenue,
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
      where: { firstName, lastName, role: TeamMemberRole.SETTER },
    });
    teamMemberId = tm?.id;
  }

  const whereMetric: Prisma.DailyMetricWhereInput = {
    date: { gte: from, lte: to },
    teamMember: {
      role: TeamMemberRole.SETTER,
    },
  };

  if (teamMemberId) {
    whereMetric.teamMember = {
      ...(whereMetric.teamMember as Prisma.TeamMemberWhereInput),
      id: teamMemberId,
    };
  }

  const metrics = await prisma.dailyMetric.aggregate({
    where: whereMetric,
    _sum: {
      callsMade: true, // Outbound Dials
      liveCalls: true, // Pickups
      bookedCalls: true, // Booked Calls
      reschedules: true,
      cashCollected: true, // Reported Revenue from EOD cash collected
    },
  });

  const mSum = metrics._sum as any;
  const outboundDials = Number(mSum.callsMade || 0);
  const pickUps = Number(mSum.liveCalls || 0);
  const bookedCalls = Number(mSum.bookedCalls || 0);
  const reschedules = Number(mSum.reschedules || 0);
  const reportedRevenue = Number(mSum.cashCollected || 0);

  // Closed Won: Count of payments attributed to setter
  const closedWon = await prisma.payment.count({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
      enrollment: {
        setter: {
          role: TeamMemberRole.SETTER,
          ...(teamMemberId ? { id: teamMemberId } : {}),
        },
      },
    },
  });

  // Cash Collected (Attributed to Setters)
  const payments = await prisma.payment.aggregate({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
      enrollment: {
        setter: {
          role: TeamMemberRole.SETTER,
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
    reschedules,
    closedWon,
    cashCollected,
    pickUpToBookedPct: pickUps > 0 ? bookedCalls / pickUps : 0,
    cashPerDay,
    cashPerBookedCall: bookedCalls > 0 ? cashCollected / bookedCalls : 0,
    monthlyPacing,
    reportedRevenue,
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
      teamMember: { role: TeamMemberRole.SETTER },
    },
    _sum: {
      callsMade: true,
      liveCalls: true,
      bookedCalls: true,
      cashCollected: true,
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

  // Closed Won by Setter (Count of payments)
  const closedWonBySetter = await prisma.payment.groupBy({
    by: ['enrollmentId'], // Need to group by enrollment -> setter, but prisma groupBy is limited.
    // Easier to fetch all payments and aggregate in memory or use raw query.
    // Using findMany approach similar to cashBySetter
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
      enrollment: { setterId: { in: memberIds } },
    },
    _count: { id: true },
  });

  // Re-fetch payments to count them per setter
  const paymentsForCount = await prisma.payment.findMany({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
      enrollment: { setterId: { in: memberIds } },
    },
    include: { enrollment: true },
  });

  const closedWonMap = new Map<number, number>();
  for (const p of paymentsForCount) {
    const sid = p.enrollment.setterId;
    if (sid) {
      closedWonMap.set(sid, (closedWonMap.get(sid) || 0) + 1);
    }
  }

  return metrics.map(m => {
    const member = memberMap.get(m.teamMemberId);
    const name = member ? `${member.firstName} ${member.lastName}` : 'Unknown';
    const mSum = m._sum as any;

    return {
      rep: name,
      callsMade: Number(mSum.callsMade || 0),
      pickUps: Number(mSum.liveCalls || 0),
      bookedCalls: Number(mSum.bookedCalls || 0),
      closedWon: closedWonMap.get(m.teamMemberId) || 0,
      ccBySetter: cashBySetter.get(m.teamMemberId) || 0,
      reportedRevenue: Number(mSum.cashCollected || 0),
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
      where: { firstName, lastName, role: TeamMemberRole.DM_SETTER },
    });
    teamMemberId = tm?.id;
  }

  const whereMetric: Prisma.DailyMetricWhereInput = {
    date: { gte: from, lte: to },
    teamMember: {
      role: TeamMemberRole.DM_SETTER,
    },
  };

  if (teamMemberId) {
    whereMetric.teamMember = {
      ...(whereMetric.teamMember as Prisma.TeamMemberWhereInput),
      id: teamMemberId,
    };
  }

  const metrics = await prisma.dailyMetric.aggregate({
    where: whereMetric,
    _sum: {
      dmsSent: true,
      conversationsStarted: true,
      bookedCalls: true,
      cashCollected: true,
    },
  });

  const mSum = metrics._sum as any;
  const dmsOutbound = Number(mSum.dmsSent || 0);
  const dmsInbound = Number(mSum.conversationsStarted || 0);
  const bookedCalls = Number(mSum.bookedCalls || 0);
  const reportedRevenue = Number(mSum.cashCollected || 0);

  // Closed Won: Count of payments attributed to DM setter
  const closedWon = await prisma.payment.count({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
      enrollment: {
        setter: {
          role: TeamMemberRole.DM_SETTER,
          ...(teamMemberId ? { id: teamMemberId } : {}),
        },
      },
    },
  });

  // Cash Collected (Attributed to DM Setters)
  const payments = await prisma.payment.aggregate({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
      enrollment: {
        setter: {
          role: TeamMemberRole.DM_SETTER,
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
    dmsInbound,
    bookedCalls,
    closedWon,
    cashCollected,
    conversationRate: dmsOutbound > 0 ? dmsInbound / dmsOutbound : 0,
    bookingRate: dmsInbound > 0 ? bookedCalls / dmsInbound : 0,
    cashPerDay,
    cashPerBookedCall: bookedCalls > 0 ? cashCollected / bookedCalls : 0,
    reportedRevenue,
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
      teamMember: { role: TeamMemberRole.DM_SETTER },
    },
    _sum: {
      dmsSent: true,
      conversationsStarted: true,
      bookedCalls: true,
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

  // Closed Won by DM Setter
  const paymentsForCount = await prisma.payment.findMany({
    where: {
      date: { gte: from, lte: to },
      status: 'PAID',
      enrollment: { setterId: { in: memberIds } },
    },
    include: { enrollment: true },
  });

  const closedWonMap = new Map<number, number>();
  for (const p of paymentsForCount) {
    const sid = p.enrollment.setterId;
    if (sid) {
      closedWonMap.set(sid, (closedWonMap.get(sid) || 0) + 1);
    }
  }

  return metrics.map(m => {
    const member = memberMap.get(m.teamMemberId);
    const name = member ? `${member.firstName} ${member.lastName}` : 'Unknown';
    const mSum = m._sum as any;

    return {
      rep: name,
      newOutboundConvos: Number(mSum.dmsSent || 0),
      outboundResponses: Number(mSum.conversationsStarted || 0),
      totalCallsBooked: Number(mSum.bookedCalls || 0),
      closedWon: closedWonMap.get(m.teamMemberId) || 0,
      ccByDmSetter: cashBySetter.get(m.teamMemberId) || 0,
      reportedRevenue: Number(mSum.cashCollected || 0),
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

export async function submitCloserEOD(data: {
  closerId: number;
  date: string;
  scheduledCalls: number;
  liveCalls: number;
  offersMade: number;
  closes: number;
  cashCollected: number;
  struggles?: string;
  notes?: string;
}) {
  const date = new Date(data.date);

  // Check if metric exists
  const existingMetric = await prisma.dailyMetric.findFirst({
    where: {
      teamMemberId: data.closerId,
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    },
  });

  if (existingMetric) {
    return prisma.dailyMetric.update({
      where: { id: existingMetric.id },
      data: {
        scheduledCalls: data.scheduledCalls,
        liveCalls: data.liveCalls,
        offersMade: data.offersMade,
        closes: data.closes,
        cashCollected: data.cashCollected,
        revenue: data.cashCollected,
        struggles: data.struggles,
        notes: data.notes,
      },
    });
  } else {
    return prisma.dailyMetric.create({
      data: {
        teamMemberId: data.closerId,
        date: new Date(data.date),
        scheduledCalls: data.scheduledCalls,
        liveCalls: data.liveCalls,
        offersMade: data.offersMade,
        closes: data.closes,
        cashCollected: data.cashCollected,
        revenue: data.cashCollected,
        struggles: data.struggles,
        notes: data.notes,
      },
    });
  }
}

export async function submitSetterEOD(data: {
  setterId: number;
  date: string;
  callsMade: number;
  liveCalls: number;
  bookedCalls: number;
  reschedules: number;
  unqualifiedLeads: number;
  notes?: string;
}) {
  const date = new Date(data.date);

  // Check if metric exists
  const existingMetric = await prisma.dailyMetric.findFirst({
    where: {
      teamMemberId: data.setterId,
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    },
  });

  if (existingMetric) {
    return prisma.dailyMetric.update({
      where: { id: existingMetric.id },
      data: {
        callsMade: data.callsMade,
        liveCalls: data.liveCalls,
        bookedCalls: data.bookedCalls,
        reschedules: data.reschedules,
        unqualifiedLeads: data.unqualifiedLeads,
        notes: data.notes,
      },
    });
  } else {
    return prisma.dailyMetric.create({
      data: {
        teamMemberId: data.setterId,
        date: new Date(data.date),
        callsMade: data.callsMade,
        liveCalls: data.liveCalls,
        bookedCalls: data.bookedCalls,
        reschedules: data.reschedules,
        unqualifiedLeads: data.unqualifiedLeads,
        notes: data.notes,
      },
    });
  }
}

export async function submitDmSetterEOD(data: {
  dmSetterId: number;
  date: string;
  dmsSent: number;
  conversationsStarted: number;
  bookedCalls: number;
  reschedules: number;
  unqualifiedLeads: number;
  notes?: string;
}) {
  const date = new Date(data.date);

  // Check if metric exists
  const existingMetric = await prisma.dailyMetric.findFirst({
    where: {
      teamMemberId: data.dmSetterId,
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    },
  });

  if (existingMetric) {
    return prisma.dailyMetric.update({
      where: { id: existingMetric.id },
      data: {
        dmsSent: data.dmsSent,
        conversationsStarted: data.conversationsStarted,
        bookedCalls: data.bookedCalls,
        reschedules: data.reschedules,
        unqualifiedLeads: data.unqualifiedLeads,
        notes: data.notes,
      },
    });
  } else {
    return prisma.dailyMetric.create({
      data: {
        teamMemberId: data.dmSetterId,
        date: new Date(data.date),
        dmsSent: data.dmsSent,
        conversationsStarted: data.conversationsStarted,
        bookedCalls: data.bookedCalls,
        reschedules: data.reschedules,
        unqualifiedLeads: data.unqualifiedLeads,
        notes: data.notes,
      },
    });
  }
}

export async function getEODReports(range: DateRange, role: TeamMemberRole) {
  const { from, to } = range;

  const metrics = await prisma.dailyMetric.findMany({
    where: {
      date: { gte: from, lte: to },
      teamMember: { role },
    },
    include: {
      teamMember: true,
    },
    orderBy: { date: 'desc' },
  });

  return metrics.map(m => ({
    id: m.id,
    date: formatDate(m.date),
    name: `${m.teamMember.firstName} ${m.teamMember.lastName}`,
    // Common
    notes: m.notes,
    struggles: m.struggles,
    // Closer
    scheduledCalls: m.scheduledCalls,
    liveCalls: m.liveCalls,
    offersMade: m.offersMade,
    closes: m.closes,
    cashCollected: Number(m.cashCollected),
    // Setter
    callsMade: m.callsMade,
    bookedCalls: m.bookedCalls,
    reschedules: m.reschedules,
    unqualifiedLeads: m.unqualifiedLeads,
    // DM Setter
    dmsSent: m.dmsSent,
    conversationsStarted: m.conversationsStarted,
  }));
}
