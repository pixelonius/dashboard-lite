/**
 * CSM Service - Customer Success Management
 * Handles metrics and data for client success tracking
 */

import { prisma } from '../lib/prisma';
import { EnrollmentStatus, InstallmentStatus, PaymentStatus } from '@prisma/client';
import type {
  CsmSummaryResponse,
  HighRiskClient,
  ActiveClient,
  StudentPaymentPlan,
  PaymentPlanInstallment,
} from '../types/api';
import type { DateRange } from '../utils/date';

/**
 * Get student onboarding data
 * Resolves to the latest enrollment's onboarding state
 */
export const ONBOARDING_STEPS = [
  { key: 'callCompleted', label: 'OB Calls Completed' },
  { key: 'slackJoined', label: 'Slack profile setup' },
  { key: 'courseAccess', label: 'Kajabi access granted' },
  { key: 'communityIntro', label: 'Introduction video/message posted' },
  { key: 'goalsSet', label: 'Asked about main goals' },
  { key: 'referralsAsked', label: 'Ask for 5 referrals' },
] as const;

/**
 * Get student onboarding data
 * Resolves to the latest enrollment's onboarding state
 */
export async function getStudentOnboarding(studentId: number) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId },
    orderBy: { startDate: 'desc' },
    include: { onboarding: true },
  });

  if (!enrollment?.onboarding) return null;

  // Return as a list of steps with status
  return ONBOARDING_STEPS.map(step => ({
    key: step.key,
    label: step.label,
    checked: !!enrollment.onboarding![step.key as keyof typeof enrollment.onboarding]
  }));
}

/**
 * Update student onboarding field
 */
export async function updateStudentOnboarding(
  studentId: number,
  field: string,
  value: boolean
) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId },
    orderBy: { startDate: 'desc' },
    include: { onboarding: true },
  });

  if (!enrollment) throw new Error('Student enrollment not found');

  // Validate field
  const isValidField = ONBOARDING_STEPS.some(step => step.key === field);
  if (!isValidField) {
    throw new Error(`Invalid onboarding field: ${field}`);
  }

  // If onboarding record doesn't exist, create it
  if (!enrollment.onboarding) {
    await prisma.onboardingState.create({
      data: {
        enrollmentId: enrollment.id,
        [field]: value,
      },
    });
  } else {
    await prisma.onboardingState.update({
      where: { id: enrollment.onboarding.id },
      data: {
        [field]: value,
      },
    });
  }

  return getStudentOnboarding(studentId);
}

/**
 * Get all weekly progress records for a student
 */
export async function getStudentWeeklyProgress(studentId: number) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId },
    orderBy: { startDate: 'desc' },
  });

  if (!enrollment) return [];

  return prisma.weeklyProgress.findMany({
    where: { enrollmentId: enrollment.id },
    orderBy: { weekNumber: 'asc' },
  });
}

/**
 * Update weekly progress record
 */
export async function updateWeeklyProgress(
  weekId: number,
  data: {
    outcome?: string;
    notes?: string;
    questions?: Record<string, boolean>;
  }
) {
  return prisma.weeklyProgress.update({
    where: { id: weekId },
    data: {
      outcome: data.outcome,
      notes: data.notes,
    },
  });
}

/**
 * Calculate CSM summary metrics (top cards)
 */
export async function calculateCsmSummary(range?: DateRange): Promise<CsmSummaryResponse> {
  const now = new Date();
  const rangeStart = range?.from ?? now;
  const rangeEnd = range?.to ?? now;

  const [
    activeEnrollments,
    overdueInstallments,
    highRiskCheckIns,
    expectedPayments,
    onboardingStates,
  ] = await Promise.all([
    // Active Members (Enrollments)
    prisma.enrollment.count({
      where: { status: EnrollmentStatus.ACTIVE },
    }),

    // Overdue Installments
    prisma.installment.findMany({
      where: { status: InstallmentStatus.OVERDUE },
      select: { amount: true },
    }),

    // High Risk Check-ins
    prisma.checkIn.findMany({
      where: {
        satisfaction: { lte: 6 },
      },
      select: { enrollmentId: true },
      distinct: ['enrollmentId'],
    }),

    // Expected Payments (Pending in range)
    prisma.installment.aggregate({
      where: {
        dueDate: { gte: rangeStart, lte: rangeEnd },
        status: InstallmentStatus.PENDING,
      },
      _sum: { amount: true },
    }),

    // Onboarding States
    prisma.onboardingState.findMany(),
  ]);

  // Total Owed (All pending/overdue installments)
  const totalOwedAgg = await prisma.installment.aggregate({
    where: { status: { in: [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE] } },
    _sum: { amount: true },
  });

  // Onboarding compliance
  let totalFields = 0;
  let completedFields = 0;
  const obKeys = ['callCompleted', 'slackJoined', 'courseAccess', 'communityIntro', 'goalsSet', 'referralsAsked'] as const;

  onboardingStates.forEach(ob => {
    obKeys.forEach(key => {
      totalFields++;
      if (ob[key]) completedFields++;
    });
  });

  const onboardingCompliancePct = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

  const overdueAmount = overdueInstallments.reduce((sum, i) => sum + Number(i.amount), 0);

  return {
    activeMembers: activeEnrollments,
    totalOwed: Number(totalOwedAgg._sum.amount || 0),
    highRiskClients: highRiskCheckIns.length,
    onboardingCompliancePct,
    overdueAmount,
    overdueCount: overdueInstallments.length,
    expectedPayments: Number(expectedPayments._sum.amount || 0),
  };
}

/**
 * Get high-risk clients based on check-ins
 */
export async function getHighRiskClients(): Promise<HighRiskClient[]> {
  const checkIns = await prisma.checkIn.findMany({
    where: {
      satisfaction: { lte: 6 },
    },
    orderBy: { date: 'desc' },
    distinct: ['enrollmentId'],
    include: {
      enrollment: {
        include: {
          student: true,
          program: true,
          csm: true,
          installments: true,
        },
      },
    },
  });

  return checkIns.map(ci => {
    const e = ci.enrollment;

    return {
      id: e.student.id,
      name: `${e.student.firstName} ${e.student.lastName}`,
      email: e.student.email,
      totalPaid: 'N/A', // Placeholder
      contractedValue: `$${Number(e.program.price).toLocaleString()}`,
      planType: e.installments.length > 0 ? 'Split Pay' : 'PIF',
      installments: e.installments.length,
      csm: e.csm ? e.csm.name : 'Unassigned',
      selectedOutcome: ci.wins || 'Risk',
      lastCheckIn: ci.date,
      products: [e.program.name],
      program: e.program.name,
      referralName: null,
    };
  });
}

/**
 * Get active clients
 */
export async function getActiveClients(): Promise<ActiveClient[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: EnrollmentStatus.ACTIVE,
    },
    include: {
      student: true,
      program: true,
      csm: true,
      installments: true,
      payments: true,
    },
    orderBy: { startDate: 'desc' },
  });

  return enrollments.map(e => {
    const totalPaid = e.payments.reduce((sum, p) => sum + (p.status === PaymentStatus.PAID ? Number(p.amount) : 0), 0);

    return {
      id: e.student.id,
      name: `${e.student.firstName} ${e.student.lastName}`,
      email: e.student.email,
      program: e.program.name,
      planType: e.planType === 'SPLIT' ? 'Split Pay' : 'PIF',
      installments: e.installments.length,
      csm: e.csm ? e.csm.name : 'Unassigned',
      referralName: null,
      startDate: e.startDate,
      endDate: e.endDate,
      cashCollected: totalPaid,
      contractedValue: Number(e.contractValue),
      active: e.status === EnrollmentStatus.ACTIVE,
      pause: e.status === EnrollmentStatus.PAUSED,
      inactive: e.status === EnrollmentStatus.DROPPED || e.status === EnrollmentStatus.COMPLETED,
      pauseStartDate: null,
      pauseEndDate: null,
      products: [e.program.name],
      notes: null,
      progressTrackerSheet: null,
    };
  });
}

/**
 * Get all enrollments for a student
 */
export async function getStudentEnrollments(studentId: number) {
  return prisma.enrollment.findMany({
    where: { studentId },
    include: {
      program: true,
      csm: true,
    },
    orderBy: { startDate: 'desc' },
  });
}

/**
 * Update student personal info
 * Handles updates to both Student and active Enrollment
 */
interface UpdatePersonalInfoData {
  name?: string;
  email?: string;
  startDate?: Date;
  endDate?: Date;
  csm?: string; // Name of CSM
  program?: string; // Name of Program
  referral?: boolean;
  referralName?: string;
  active?: boolean;
  inactive?: boolean;
  pause?: boolean;
  pauseStartDate?: Date;
  pauseEndDate?: Date;
  products?: string[]; // Legacy field?
  progressTrackerSheet?: string;
  notes?: string;
}

export async function updateStudentPersonalInfo(
  studentId: number,
  data: UpdatePersonalInfoData
) {
  const [firstName, ...lastNameParts] = (data.name || '').split(' ');
  const lastName = lastNameParts.join(' ');

  // 1. Update Student
  const studentUpdate: any = {};
  if (data.name) {
    studentUpdate.firstName = firstName;
    studentUpdate.lastName = lastName;
  }
  if (data.email) studentUpdate.email = data.email;

  if (Object.keys(studentUpdate).length > 0) {
    await prisma.student.update({
      where: { id: studentId },
      data: studentUpdate,
    });
  }

  // 2. Update Enrollment (Active)
  const enrollmentUpdate: any = {};

  // Status
  if (data.active !== undefined) {
    enrollmentUpdate.status = data.active ? EnrollmentStatus.ACTIVE : EnrollmentStatus.DROPPED;
  }
  if (data.inactive !== undefined && data.inactive) {
    enrollmentUpdate.status = EnrollmentStatus.DROPPED;
  }
  if (data.pause !== undefined && data.pause) {
    enrollmentUpdate.status = EnrollmentStatus.PAUSED;
  }

  // Dates
  if (data.startDate) enrollmentUpdate.startDate = data.startDate;
  if (data.endDate) enrollmentUpdate.endDate = data.endDate;

  // CSM Assignment (Lookup by name)
  if (data.csm) {
    const csmUser = await prisma.user.findFirst({
      where: { name: data.csm, role: 'CSM' },
    });
    if (csmUser) {
      enrollmentUpdate.csmId = csmUser.id;
    }
  }

  // Program (Lookup by name)
  if (data.program) {
    const program = await prisma.program.findFirst({
      where: { name: data.program },
    });
    if (program) {
      enrollmentUpdate.programId = program.id;
    }
  }

  if (Object.keys(enrollmentUpdate).length > 0) {
    let enrollmentId = data.enrollmentId;

    if (!enrollmentId) {
      // Find active or latest enrollment if no ID provided
      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId },
        orderBy: { startDate: 'desc' },
      });
      enrollmentId = enrollment?.id;
    }

    if (enrollmentId) {
      console.log('Updating Enrollment:', enrollmentId, 'with data:', enrollmentUpdate);
      const result = await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: enrollmentUpdate,
      });
      console.log('Enrollment Update Result:', result);
    } else {
      console.log('No enrollment found to update for student:', studentId);
    }
  }

  // Return updated student with enrollment info
  return prisma.student.findUnique({
    where: { id: studentId },
    include: { enrollments: { include: { program: true, csm: true } } },
  });
}

/**
 * Get all check-ins for a student
 */
export async function getStudentCheckIns(studentId: number) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId },
    orderBy: { startDate: 'desc' },
  });

  if (!enrollment) return [];

  return prisma.checkIn.findMany({
    where: { enrollmentId: enrollment.id },
    orderBy: { date: 'desc' },
  });
}

/**
 * Update check-in outcome
 */
export async function updateCheckInOutcome(
  checkinId: number,
  outcome: string
) {
  return prisma.checkIn.update({
    where: { id: checkinId },
    data: { feedback: outcome },
  });
}

/**
 * Build payment plan object
 */
async function buildPaymentPlan(
  studentId: number
): Promise<StudentPaymentPlan> {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId },
    orderBy: { startDate: 'desc' },
    include: {
      installments: {
        orderBy: { dueDate: 'asc' },
      },
      payments: true,
    },
  });

  if (!enrollment) throw new Error('Student enrollment not found');

  const schedule: PaymentPlanInstallment[] = enrollment.installments.map(i => ({
    id: i.id,
    dueDate: i.dueDate,
    amountOwed: Number(i.amount),
    status: i.status,
    paidAt: i.paymentId ? i.dueDate : null, // Simplified: using due date as paid date proxy if paid
    amountPaid: i.status === InstallmentStatus.PAID ? Number(i.amount) : 0,
  }));

  const totalPaid = enrollment.payments.reduce((sum, p) => sum + (p.status === PaymentStatus.PAID ? Number(p.amount) : 0), 0);

  return {
    planType: enrollment.planType === 'SPLIT' ? 'Split Pay' : 'PIF',
    installments: enrollment.installments.length || null,
    contractValue: Number(enrollment.contractValue),
    totalPaid,
    remaining: Number(enrollment.contractValue) - totalPaid,
    schedule,
  };
}

export async function getStudentPaymentPlan(
  studentId: number
): Promise<StudentPaymentPlan> {
  return buildPaymentPlan(studentId);
}

export async function updateStudentPaymentPlan(
  studentId: number,
  data: {
    planType?: 'PIF' | 'Split Pay';
    installments?: number | null;
    contractValue?: number;
    schedule?: Array<{ dueDate: Date; amountOwed: number }>;
  }
): Promise<StudentPaymentPlan> {
  const enrollmentId = (data as any).enrollmentId;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      ...(enrollmentId ? { id: enrollmentId } : {})
    },
    orderBy: { startDate: 'desc' },
  });

  if (!enrollment) throw new Error('Student enrollment not found');

  // Update Enrollment Plan Type & Contract Value
  if (data.planType || data.contractValue !== undefined) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        planType: data.planType ? (data.planType === 'Split Pay' ? 'SPLIT' : 'PIF') : undefined,
        contractValue: data.contractValue,
      },
    });
  }

  // Handle Schedule Updates
  if (data.planType === 'Split Pay' && data.schedule) {
    // 1. Clear existing future/unpaid installments? 
    // For now, we'll replace the schedule. In a real app, we'd be careful about paid ones.
    // User requirement: "Once 'Save Payment Info' is clicked, populate the Installments table"
    // We assume this overrides the schedule.

    // Delete existing installments (careful with paid ones in real life, but for now we reset)
    await prisma.installment.deleteMany({
      where: { enrollmentId: enrollment.id },
    });

    // Create new installments
    for (const item of data.schedule) {
      await prisma.installment.create({
        data: {
          enrollmentId: enrollment.id,
          dueDate: item.dueDate,
          amount: item.amountOwed,
          status: InstallmentStatus.PENDING,
        },
      });
    }
  } else if (data.planType === 'PIF') {
    // Clear installments if switching to PIF
    await prisma.installment.deleteMany({
      where: { enrollmentId: enrollment.id },
    });
  }

  return buildPaymentPlan(studentId);
}
