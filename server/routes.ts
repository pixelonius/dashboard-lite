import type { Express } from "express";
import { createServer, type Server } from "http";
import { prisma } from "./lib/prisma";
import { TeamMemberRole, PaymentPlanType, PaymentStatus, EnrollmentStatus, InstallmentStatus } from "@prisma/client";
import { generateToken, setAuthCookie, clearAuthCookie, verifyPassword, hashPassword } from "./lib/auth";
import { requireAuth, AuthRequest } from "./middleware/auth";
import { loginSchema, signupSchema, dateRangeSchema, updateProfileSchema, updatePaymentAssignmentSchema, closerEodSchema, setterEodSchema, dmSetterEodSchema, newPaymentSchema, programSchema, updateProgramSchema } from "./lib/validation";
import { errorHandler } from "./lib/error-handler";
import { normalizeDateRange, formatDate } from "./utils/date";
import * as homeService from "./services/home";
import * as salesService from "./services/sales";
import * as adsService from "./services/ads";
import * as emailService from "./services/email";
import validator from "validator";

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== AUTH ROUTES =====
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

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
        // homeService.getCashCollectedBySource(range), // Commented out as per request
        homeService.getHomePieCharts(range),
      ]);

      res.json({
        range: {
          from: formatDate(range.from),
          to: formatDate(range.to),
          tz: range.tz,
        },
        cards,
        charts: {
          // cashCollectedBySource: charts[0], // Commented out
          cashCollectedBySource: [], // Return empty to satisfy type if needed, or update type. I updated type but I'll leave it empty/mocked to avoid frontend errors before I update frontend.
          ...charts
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

  // ===== PUBLIC ROUTES =====
  app.get("/api/public/closers", async (req, res, next) => {
    try {
      const members = await prisma.teamMember.findMany({
        where: { role: TeamMemberRole.CLOSER, active: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
        orderBy: { firstName: 'asc' },
      });

      const options = members.map(m => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
      }));

      res.json({ members: options });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/public/setters", async (req, res, next) => {
    try {
      const members = await prisma.teamMember.findMany({
        where: { role: TeamMemberRole.SETTER, active: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
        orderBy: { firstName: 'asc' },
      });

      const options = members.map(m => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
      }));

      res.json({ members: options });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/public/dm-setters", async (req, res, next) => {
    try {
      const members = await prisma.teamMember.findMany({
        where: { role: TeamMemberRole.DM_SETTER, active: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
        orderBy: { firstName: 'asc' },
      });

      const options = members.map(m => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
      }));

      res.json({ members: options });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sales/closer-eod", async (req, res, next) => {
    try {
      const data = closerEodSchema.parse(req.body);
      const result = await salesService.submitCloserEOD(data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sales/setter-eod", async (req, res, next) => {
    try {
      const data = setterEodSchema.parse(req.body);
      const result = await salesService.submitSetterEOD(data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sales/dm-setter-eod", async (req, res, next) => {
    try {
      const data = dmSetterEodSchema.parse(req.body);
      const result = await salesService.submitDmSetterEOD(data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // ===== PAYMENTS ROUTES =====
  app.patch("/api/payments/:id/assignment", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ error: "Invalid payment ID" });
      }

      const { assignedCloserId, assignedSetterId } = updatePaymentAssignmentSchema.parse(req.body);

      // Find the payment to get the enrollment
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { enrollment: true },
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Update the enrollment
      const updatedEnrollment = await prisma.enrollment.update({
        where: { id: payment.enrollmentId },
        data: {
          ...(assignedCloserId !== undefined ? { closerId: assignedCloserId } : {}),
          ...(assignedSetterId !== undefined ? { setterId: assignedSetterId } : {}),
        },
      });

      res.json({ success: true, enrollment: updatedEnrollment });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sales/new-payment", async (req, res, next) => {
    try {
      const data = newPaymentSchema.parse(req.body);

      // Split name (simple split)
      const nameParts = data.fullName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      // 1. Find or Create Student
      const student = await prisma.student.upsert({
        where: { email: data.email },
        update: {
          firstName,
          lastName,
          phone: data.phone || undefined, // Update phone if provided
        },
        create: {
          email: data.email,
          firstName,
          lastName,
          phone: data.phone,
        },
      });

      // 2. Create Enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          programId: data.programId,
          planType: data.planType as PaymentPlanType,
          contractValue: data.totalValue,
          status: EnrollmentStatus.ACTIVE,
          startDate: new Date(data.startDate),
        },
      });

      const promises = [];

      // 3. Handle PIF
      if (data.planType === 'PIF') {
        const payment = await prisma.payment.create({
          data: {
            enrollmentId: enrollment.id,
            amount: data.totalValue,
            date: new Date(data.startDate),
            status: PaymentStatus.PAID,
            email: data.email,
            method: 'Form Submission',
          },
        });
        promises.push(payment);
      }

      // 4. Handle SPLIT
      if (data.planType === 'SPLIT' && data.installments && data.installments.length > 0) {
        // Create installments
        for (let i = 0; i < data.installments.length; i++) {
          const instData = data.installments[i];
          const isFirst = i === 0;

          // For the first installment, we create a PAID Payment immediately
          let paymentId = null;
          if (isFirst) {
            const payment = await prisma.payment.create({
              data: {
                enrollmentId: enrollment.id,
                amount: instData.amount,
                date: new Date(instData.dueDate),
                status: PaymentStatus.PAID,
                email: data.email,
                method: 'Form Submission - Installment 1',
              }
            });
            paymentId = payment.id;
          }

          // Create the Installment record
          const installment = await prisma.installment.create({
            data: {
              enrollmentId: enrollment.id,
              amount: instData.amount,
              dueDate: new Date(instData.dueDate),
              status: isFirst ? InstallmentStatus.PAID : InstallmentStatus.PENDING,
              paymentId: paymentId, // Link if paid
            }
          });
          promises.push(installment);
        }
      }

      await Promise.all(promises);

      res.status(201).json({ success: true, studentId: student.id, enrollmentId: enrollment.id });
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

  // ===== PROGRAMS ROUTES =====
  app.get("/api/programs", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      // User requested "Return all active programs"
      const programs = await prisma.program.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          active: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
      res.json({ programs });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/public/programs", async (req, res, next) => {
    try {
      const programs = await prisma.program.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
      res.json({ programs });
    } catch (error) {
      next(error);
    }
  });

  // ===== PUBLIC INSTALLMENT ROUTES =====
  app.get("/api/public/enrollments/split", async (req, res, next) => {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          planType: 'SPLIT',
          status: 'ACTIVE',
        },
        include: {
          student: true,
          program: true,
        },
        orderBy: {
          student: { lastName: 'asc' }
        }
      });

      const formatted = enrollments.map(e => ({
        id: e.id,
        label: `${e.program.name} - ${e.student.firstName} ${e.student.lastName}`,
      }));

      res.json({ enrollments: formatted });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/public/enrollments/:id/installments", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const installments = await prisma.installment.findMany({
        where: { enrollmentId: id },
        orderBy: { dueDate: 'asc' },
      });
      res.json({ installments });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/public/installments/:id/pay", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);

      // 1. Get the installment
      const installment = await prisma.installment.findUnique({
        where: { id },
        include: { enrollment: { include: { student: true } } }
      });

      if (!installment) {
        return res.status(404).json({ error: "Installment not found" });
      }

      if (installment.status === 'PAID') {
        return res.status(400).json({ error: "Installment is already paid" });
      }

      // 2. Create Payment Record first
      const payment = await prisma.payment.create({
        data: {
          enrollmentId: installment.enrollmentId,
          amount: installment.amount,
          date: new Date(),
          status: PaymentStatus.PAID,
          email: installment.enrollment.student.email, // Use student email
          method: 'Online Installment Payment',
        }
      });

      // 3. Update Installment
      const updatedInstallment = await prisma.installment.update({
        where: { id },
        data: {
          status: InstallmentStatus.PAID,
          paymentId: payment.id,
        }
      });

      res.json({ success: true, installment: updatedInstallment });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/programs", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { name, active } = programSchema.parse(req.body);
      const program = await prisma.program.create({
        data: {
          name,
          active: active !== undefined ? active : true,
          price: 0 // Required by DB, defaulting to 0 for now as form handles value manually
        },
      });
      res.status(201).json(program);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/programs/:id", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { name, active } = updateProgramSchema.parse(req.body);
      const program = await prisma.program.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(active !== undefined && { active }),
        },
      });
      res.json(program);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/programs/:id", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const id = parseInt(req.params.id);
      // Soft delete
      const program = await prisma.program.update({
        where: { id },
        data: { active: false },
      });
      res.json(program);
    } catch (error) {
      next(error);
    }
  });

  // ===== PRODUCTS ROUTES (Public/Frontend usage of programs) =====

  // ===== TEAM ROUTES =====
  app.get("/api/reports/eod", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { from, to } = dateRangeSchema.parse(req.query);
      const role = req.query.role as TeamMemberRole;
      if (!role || !Object.values(TeamMemberRole).includes(role)) {
        return res.status(400).json({ error: "Valid role is required" });
      }

      const range = normalizeDateRange(from, to);
      const reports = await salesService.getEODReports(range, role);
      res.json({ reports });
    } catch (error) {
      next(error);
    }
  });

  // Team Member Management
  app.post("/api/team-members", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { firstName, lastName, role } = req.body; // Add validation schema usage here
      const member = await prisma.teamMember.create({
        data: { firstName, lastName, role, active: true },
      });
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/team-members/:id", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { firstName, lastName, role, active } = req.body;
      const member = await prisma.teamMember.update({
        where: { id },
        data: { firstName, lastName, role, active },
      });
      res.json(member);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/team-members/:id", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const id = parseInt(req.params.id);
      // Soft delete
      const member = await prisma.teamMember.update({
        where: { id },
        data: { active: false },
      });
      res.json(member);
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
