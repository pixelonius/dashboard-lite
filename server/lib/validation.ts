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
