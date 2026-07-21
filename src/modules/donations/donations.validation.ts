import { z } from "zod";

export const donationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listDonationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["Pending", "Confirmed"]).optional(),
});

export const createDonationSchema = z.object({
  donor: z.string().min(1).max(150),
  amount: z.coerce.number().positive(),
  purpose: z.string().max(255).optional(),
});

export const updateDonationSchema = z.object({
  donor: z.string().min(1).max(150).optional(),
  amount: z.coerce.number().positive().optional(),
  purpose: z.string().max(255).optional(),
  status: z.enum(["Pending", "Confirmed"]).optional(),
});
