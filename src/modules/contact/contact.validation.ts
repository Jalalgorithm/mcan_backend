import { z } from "zod";

export const contactIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listContactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  isRead: z.coerce.boolean().optional(),
  category: z
    .enum(["general", "membership", "events", "partnership", "complaint", "other"])
    .optional(),
});

export const createContactSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  subject: z.string().min(5).max(150),
  category: z.enum(["general", "membership", "events", "partnership", "complaint", "other"]),
  message: z.string().min(20).max(2000),
});
