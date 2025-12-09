import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['SALES', 'MARKETING']).default('SALES'),
  secretKey: z.string().min(1, "Signup key is required"),
});

export const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum(['WON', 'LOST', 'PENDING']).optional(),
});

export const contentStatusSchema = z.object({
  status: z.enum(['PRODUCED', 'REVISION', 'SCHEDULED', 'PUBLISHED']).optional(),
});

export const paymentPlanStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'DEFAULTED']).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export const updatePaymentAssignmentSchema = z.object({
  assignedCloserId: z.number().int().positive().nullable().optional(),
  assignedSetterId: z.number().int().positive().nullable().optional(),
});

export const closerEodSchema = z.object({
  closerId: z.number().int().positive("Closer is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  scheduledCalls: z.number().int().min(0, "Must be 0 or greater"),
  liveCalls: z.number().int().min(0, "Must be 0 or greater"),
  offersMade: z.number().int().min(0, "Must be 0 or greater"),
  closes: z.number().int().min(0, "Must be 0 or greater"),
  cashCollected: z.number().min(0, "Must be 0 or greater"),
  struggles: z.string().optional(),
  notes: z.string().optional(),
});

export const setterEodSchema = z.object({
  setterId: z.number().int().positive("Setter is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  callsMade: z.number().int().min(0, "Must be 0 or greater"),
  liveCalls: z.number().int().min(0, "Must be 0 or greater"),
  bookedCalls: z.number().int().min(0, "Must be 0 or greater"),
  reschedules: z.number().int().min(0, "Must be 0 or greater"),
  unqualifiedLeads: z.number().int().min(0, "Must be 0 or greater"),
  notes: z.string().optional(),
});

export const dmSetterEodSchema = z.object({
  dmSetterId: z.number().int().positive("DM Setter is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  dmsSent: z.number().int().min(0, "Must be 0 or greater"),
  conversationsStarted: z.number().int().min(0, "Must be 0 or greater"),
  bookedCalls: z.number().int().min(0, "Must be 0 or greater"),
  reschedules: z.number().int().min(0, "Must be 0 or greater"),
  unqualifiedLeads: z.number().int().min(0, "Must be 0 or greater"),
  notes: z.string().optional(),
});
