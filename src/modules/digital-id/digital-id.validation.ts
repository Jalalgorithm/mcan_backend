import { z } from "zod";

export const digitalIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listDigitalIdsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "approved", "rejected", "revoked"]).optional(),
  search: z.string().optional(),
});

export const requestDigitalIdSchema = z.object({
  passportPhoto: z.string().url(),
  signature: z.string().url().optional(),
  additionalNote: z.string().max(500).optional(),
});

export const approveDigitalIdSchema = z.object({
  note: z.string().max(500).optional(),
});

export const rejectDigitalIdSchema = z.object({
  reason: z.string().min(10).max(500),
});

export const revokeDigitalIdSchema = z.object({
  reason: z.string().min(1).max(500),
});
