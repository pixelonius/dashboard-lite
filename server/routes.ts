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
