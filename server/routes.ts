import type { Express } from "express";
import { createServer, type Server } from "http";
import { prisma } from "./lib/prisma";
import { TeamMemberRole } from "@prisma/client";
import { generateToken, setAuthCookie, clearAuthCookie, verifyPassword, hashPassword } from "./lib/auth";
import { requireAuth, AuthRequest } from "./middleware/auth";
import { loginSchema, signupSchema, dateRangeSchema, updateProfileSchema, updatePaymentAssignmentSchema } from "./lib/validation";
import { errorHandler } from "./lib/error-handler";
import { normalizeDateRange, formatDate } from "./utils/date";
import * as homeService from "./services/home";
import * as salesService from "./services/sales";
import * as csmService from "./services/csm";
import * as adsService from "./services/ads";
import * as emailService from "./services/email";
import validator from "validator";

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== AUTH ROUTES =====
  app.post("/api/v1/auth/login", async (req, res, next) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      setAuthCookie(res, token);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/auth/signup", async (req, res, next) => {
    try {
      const { name, email, password, role, secretKey } = signupSchema.parse(req.body);

      const configuredSecret = process.env.SIGNUP_SECRET_KEY;
      if (!configuredSecret) {
        return res.status(500).json({ error: "Signup is not configured" });
      }

      if (secretKey !== configuredSecret) {
        return res.status(403).json({
          error: "You have entered the wrong key. If you are authorized to create an account, please reach out to the administrator",
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      // Generate token and set auth cookie
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      setAuthCookie(res, token);

      res.status(201).json({ user: newUser });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/auth/logout", (req, res) => {
    clearAuthCookie(res);
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/v1/auth/me", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { id: true, email: true, name: true, role: true },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/v1/auth/profile", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { name, email } = updateProfileSchema.parse(req.body);

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== req.user!.userId) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { name, email },
        select: { id: true, email: true, name: true, role: true },
      });

      res.json({ user: updatedUser });
    } catch (error) {
      next(error);
    }
  });

  // ===== HOME PAGE ROUTES =====
  app.get("/api/home/summary", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const range = normalizeDateRange(from, to);

      const [cards, charts] = await Promise.all([
        homeService.calculateHomeCards(range),
        homeService.getCashCollectedBySource(range),
      ]);

      res.json({
        range: {
          from: formatDate(range.from),
          to: formatDate(range.to),
          tz: range.tz,
        },
        cards,
        charts: {
          cashCollectedBySource: charts,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/home/transactions", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const range = normalizeDateRange(from, to);

      const result = await homeService.getRecentTransactions(range, page, limit);

      res.json({
        ...result,
        page,
        limit,
      });
    } catch (error) {
      next(error);
    }
  });

  // ===== SALES PAGE ROUTES =====
  app.get("/api/sales/top-cards", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const range = normalizeDateRange(from, to);

      const topCards = await salesService.calculateSalesTopCards(range);

      res.json({
        range: {
          from: formatDate(range.from),
          to: formatDate(range.to),
          tz: range.tz,
        },
        ...topCards,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sales/closers", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const member = req.query.member as string | undefined;
      const range = normalizeDateRange(from, to);

      const [metrics, performance, payments] = await Promise.all([
        salesService.calculateClosersMetrics(range, member),
        salesService.getCloserPerformance(range),
        salesService.getCloserPayments(range),
      ]);

      res.json({
        range: {
          from: formatDate(range.from),
          to: formatDate(range.to),
          tz: range.tz,
        },
        metrics,
        performance,
        payments,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sales/setters", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const member = req.query.member as string | undefined;
      const range = normalizeDateRange(from, to);

      const [metrics, performance] = await Promise.all([
        salesService.calculateSettersMetrics(range, member),
        salesService.getSetterPerformance(range),
      ]);

      res.json({
        range: {
          from: formatDate(range.from),
          to: formatDate(range.to),
          tz: range.tz,
        },
        metrics,
        performance,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sales/dm-setters", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const member = req.query.member as string | undefined;
      const range = normalizeDateRange(from, to);

      const [metrics, performance] = await Promise.all([
        salesService.calculateDmSettersMetrics(range, member),
        salesService.getDmSetterPerformance(range),
      ]);

      res.json({
        range: {
          from: formatDate(range.from),
          to: formatDate(range.to),
          tz: range.tz,
        },
        metrics,
        performance,
      });
    } catch (error) {
      next(error);
    }
  });

  // ===== TEAM MEMBERS ROUTE (for dropdowns) =====
  app.get("/api/team-members", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const role = req.query.role as string | undefined;

      const whereClause = role ? { role: role as TeamMemberRole, active: true } : { active: true };

      const members = await prisma.teamMember.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
        orderBy: { firstName: 'asc' },
      });

      const options = members.map(m => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        role: m.role || '',
      }));

      res.json({ members: options });
    } catch (error) {
      next(error);
    }
  });

  // ===== CSM PAGE ROUTES =====
  app.get("/api/v1/csm/summary", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const range = normalizeDateRange(from, to);
      const summary = await csmService.calculateCsmSummary(range);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/csm/high-risk", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const clients = await csmService.getHighRiskClients();
      res.json({ clients });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/csm/active-clients", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const clients = await csmService.getActiveClients();
      res.json({ clients });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/v1/csm/assign-csm", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { studentEmail, csmFirstName } = req.body;

      if (!studentEmail) {
        return res.status(400).json({ error: "Student email is required" });
      }

      // Find student
      const student = await prisma.student.findUnique({
        where: { email: studentEmail },
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Find CSM User
      let csmId: number | null = null;
      if (csmFirstName) {
        const csm = await prisma.user.findFirst({
          where: { name: { contains: csmFirstName, mode: 'insensitive' }, role: 'CSM' },
        });
        if (csm) csmId = csm.id;
      }

      // Update active enrollment
      await prisma.enrollment.updateMany({
        where: { studentId: student.id, status: 'ACTIVE' },
        data: { csmId },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/v1/csm/students/:id/personal-info", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const {
        name,
        email,
        startDate,
        endDate,
        csm,
        program,
        referral,
        referral_name,
        active,
        inactive,
        pause,
        pauseStartDate,
        pauseEndDate,
        products,
        progressTrackerSheet,
        notes,
        enrollmentId,
      } = req.body;

      console.log('Received CSM Update Request:', { studentId, body: req.body });

      const updated = await csmService.updateStudentPersonalInfo(studentId, {
        name,
        email,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        csm,
        program,
        referral,
        active,
        inactive,
        pause,
        pauseStartDate: pauseStartDate ? new Date(pauseStartDate) : undefined,
        pauseEndDate: pauseEndDate ? new Date(pauseEndDate) : undefined,
        products,
        progressTrackerSheet,
        notes,
        referralName: referral_name,
        enrollmentId,
      });

      console.log('CSM Update Result:', updated);

      res.json({ success: true, student: updated });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/payments/:id/assignment", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const paymentId = parseInt(req.params.id, 10);
      if (Number.isNaN(paymentId)) {
        return res.status(400).json({ message: "Invalid payment id" });
      }

      const payload = updatePaymentAssignmentSchema.parse(req.body);
      const hasCloserField = Object.prototype.hasOwnProperty.call(req.body ?? {}, "assignedCloserId");
      const hasSetterField = Object.prototype.hasOwnProperty.call(req.body ?? {}, "assignedSetterId");

      if (!hasCloserField && !hasSetterField) {
        return res.status(400).json({ message: "No assignment data provided" });
      }

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { enrollment: true },
      });

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      const data: { closerId?: number | null; setterId?: number | null } = {};

      if (hasCloserField) {
        const closerId = payload.assignedCloserId ?? null;
        if (closerId !== null) {
          const closer = await prisma.teamMember.findFirst({
            where: { id: closerId, role: "CLOSER", active: true },
            select: { id: true },
          });

          if (!closer) {
            return res.status(400).json({ message: "Invalid closer selected" });
          }
        }
        data.closerId = closerId;
      }

      if (hasSetterField) {
        const setterId = payload.assignedSetterId ?? null;
        if (setterId !== null) {
          const setter = await prisma.teamMember.findFirst({
            where: { id: setterId, role: { in: ["SETTER", "DM_SETTER"] }, active: true },
            select: { id: true },
          });

          if (!setter) {
            return res.status(400).json({ message: "Invalid setter selected" });
          }
        }
        data.setterId = setterId;
      }

      // Update Enrollment assignments
      const updatedEnrollment = await prisma.enrollment.update({
        where: { id: payment.enrollmentId },
        data,
        select: {
          id: true,
          closerId: true,
          setterId: true,
        },
      });

      res.json({
        payment: {
          id: payment.id,
          assignedCloserId: updatedEnrollment.closerId,
          assignedSetterId: updatedEnrollment.setterId,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/csm/students/:id/payment-plan", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const paymentPlan = await csmService.getStudentPaymentPlan(studentId);
      res.json({ paymentPlan });
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return res.status(404).json({ error: "Student not found" });
      }
      next(error);
    }
  });

  app.patch("/api/v1/csm/students/:id/payment-plan", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const { planType, installments, schedule } = req.body;

      if (planType && planType !== 'PIF' && planType !== 'Split Pay') {
        return res.status(400).json({ error: "Invalid plan type" });
      }

      let normalizedInstallments: number | null | undefined = undefined;
      if (installments !== undefined) {
        if (installments === null) {
          normalizedInstallments = null;
        } else {
          const parsedInstallments = parseInt(String(installments), 10);
          if (isNaN(parsedInstallments) || parsedInstallments < 2 || parsedInstallments > 5) {
            return res.status(400).json({ error: "Installments must be between 2 and 5" });
          }
          normalizedInstallments = parsedInstallments;
        }
      }

      let normalizedSchedule: Array<{ dueDate: Date; amountOwed: number }> | undefined = undefined;
      if (schedule !== undefined) {
        if (!Array.isArray(schedule)) {
          return res.status(400).json({ error: "Schedule must be an array" });
        }

        normalizedSchedule = schedule.map((entry, idx) => {
          if (!entry || !entry.dueDate) {
            throw new Error(`Invalid schedule entry at position ${idx + 1}`);
          }

          const dueDate = new Date(entry.dueDate);
          if (isNaN(dueDate.getTime())) {
            throw new Error(`Invalid due date at position ${idx + 1}`);
          }

          const rawAmount = entry.amountOwed ?? entry.amount;
          if (rawAmount === undefined || rawAmount === null) {
            throw new Error(`Invalid amount at position ${idx + 1}`);
          }
          const amountNumber = typeof rawAmount === 'string' ? parseFloat(rawAmount) : Number(rawAmount);
          if (isNaN(amountNumber) || amountNumber < 0) {
            throw new Error(`Invalid amount at position ${idx + 1}`);
          }

          return {
            dueDate,
            amountOwed: amountNumber,
          };
        });
      }

      const paymentPlan = await csmService.updateStudentPaymentPlan(studentId, {
        planType,
        installments: planType === 'PIF' ? null : normalizedInstallments,
        schedule: planType === 'PIF' ? undefined : normalizedSchedule,
      });

      res.json({ success: true, paymentPlan });
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return res.status(404).json({ error: "Student not found" });
      }
      if (error instanceof Error && error.message.startsWith('Invalid')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  // Get student onboarding data
  app.get("/api/v1/csm/students/:id/onboarding", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const onboarding = await csmService.getStudentOnboarding(studentId);

      if (!onboarding) {
        return res.status(404).json({ error: "Onboarding data not found" });
      }

      res.json({ onboarding });
    } catch (error) {
      next(error);
    }
  });

  // Update student onboarding field
  app.patch("/api/v1/csm/students/:id/onboarding", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const { field, value } = req.body;

      if (!field || typeof value !== 'boolean') {
        return res.status(400).json({ error: "Field name and boolean value are required" });
      }

      // Validate field name to prevent SQL injection
      const allowedFields = [
        'callCompleted',
        'slackJoined',
        'courseAccess',
        'communityIntro',
        'goalsSet',
        'referralsAsked',
      ];

      if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: "Invalid field name" });
      }

      const updated = await csmService.updateStudentOnboarding(studentId, field, value);
      res.json({ success: true, onboarding: updated });
    } catch (error) {
      next(error);
    }
  });

  // Get student weekly progress
  app.get("/api/v1/csm/students/:id/weekly-progress", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const progress = await csmService.getStudentWeeklyProgress(studentId);
      res.json({ progress });
    } catch (error) {
      next(error);
    }
  });

  // Update weekly progress record
  app.patch("/api/v1/csm/students/:id/weekly-progress/:weekId", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const weekId = parseInt(req.params.weekId);
      if (isNaN(weekId)) {
        return res.status(400).json({ error: "Invalid week ID" });
      }

      const { outcome, notes, questions } = req.body;

      const updated = await csmService.updateWeeklyProgress(weekId, {
        outcome,
        notes,
        questions,
      });

      if (!updated) {
        return res.status(404).json({ error: "Weekly progress record not found" });
      }

      res.json({ success: true, progress: updated });
    } catch (error) {
      next(error);
    }
  });

  // Get student check-ins
  app.get("/api/v1/csm/students/:id/check-ins", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const checkIns = await csmService.getStudentCheckIns(studentId);
      res.json({ checkIns });
    } catch (error) {
      next(error);
    }
  });

  // Update check-in outcome
  app.patch("/api/v1/csm/students/:id/check-ins/:checkinId", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const checkinId = parseInt(req.params.checkinId);
      if (isNaN(checkinId)) {
        return res.status(400).json({ error: "Invalid check-in ID" });
      }

      const { outcome } = req.body;
      if (!outcome) {
        return res.status(400).json({ error: "Outcome is required" });
      }

      const updated = await csmService.updateCheckInOutcome(checkinId, outcome);
      res.json({ success: true, checkIn: updated });
    } catch (error) {
      next(error);
    }
  });

  // ===== PRODUCTS ROUTES =====
  // ===== PRODUCTS ROUTES =====
  app.get("/api/v1/products", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const products = await prisma.program.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Map to frontend-friendly format
      const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
      }));

      res.json({ products: formattedProducts });
    } catch (error) {
      next(error);
    }
  });

  // ===== TEAM ROUTES =====
  app.get("/api/v1/team/csm-members", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const members = await prisma.user.findMany({
        where: { role: 'CSM', active: true },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json({ members });
    } catch (error) {
      next(error);
    }
  });

  // ===== ENROLLMENTS ROUTES =====
  app.get("/api/v1/csm/students/:id/enrollments", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const enrollments = await csmService.getStudentEnrollments(studentId);
      res.json({ enrollments });
    } catch (error) {
      next(error);
    }
  });

  // ===== MARKETING - ADS ROUTES =====
  app.get("/api/v1/ads/summary", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const range = normalizeDateRange(from, to);
      const summary = await adsService.calculateAdsSummary(range);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/ads/spend-by-campaign", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const range = normalizeDateRange(from, to);
      const data = await adsService.getSpendByCampaign(range);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/ads/campaign-metrics", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const range = normalizeDateRange(from, to);
      const metrics = await adsService.getCampaignMetrics(range);
      res.json({ campaigns: metrics });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/ads/performance", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const range = normalizeDateRange(from, to);
      const metrics = await adsService.getAdPerformanceMetrics(range);
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  });

  // ===== MARKETING - EMAIL ROUTES =====
  app.get("/api/v1/email/summary", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const range = from && to ? normalizeDateRange(from, to) : undefined;
      const summary = await emailService.calculateEmailSummary(range);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/email/broadcasts", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const broadcasts = await emailService.getBroadcastsList(limit);
      res.json({ broadcasts });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/email/broadcasts-over-time", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const range = normalizeDateRange(from, to);
      const data = await emailService.getBroadcastsOverTime(range);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // Error handler
  app.use(errorHandler);

  const httpServer = createServer(app);
  return httpServer;
}
