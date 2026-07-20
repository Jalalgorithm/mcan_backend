import { z } from "zod";

export const eventIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const eventSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  upcoming: z.coerce.boolean().optional(),
  past: z.coerce.boolean().optional(),
  category: z
    .enum(["meeting", "conference", "seminar", "workshop", "social", "other"])
    .optional(),
  state: z.string().optional(),
  search: z.string().optional(),
});

export const listEventsAdminQuerySchema = listEventsQuerySchema.extend({
  status: z.enum(["draft", "published", "cancelled", "past"]).optional(),
});

const locationSchema = z.object({
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isOnline: z.boolean().default(false),
  onlineLink: z.string().url().nullable().optional(),
});

export const createEventSchema = z
  .object({
    title: z.string().min(5).max(200),
    description: z.string().optional(),
    category: z.enum(["meeting", "conference", "seminar", "workshop", "social", "other"]),
    coverImage: z.string().url().optional(),
    location: locationSchema.optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    capacity: z.number().int().positive().optional(),
    isFree: z.boolean().default(true),
    price: z.number().nonnegative().optional(),
    organizerContact: z.string().max(255).optional(),
    status: z.enum(["draft", "published", "cancelled"]).default("draft"),
  })
  .refine((data) => data.isFree || data.price !== undefined, {
    message: "price is required when isFree is false",
    path: ["price"],
  })
  .refine((data) => !data.endDate || new Date(data.endDate) > new Date(data.startDate), {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

export const updateEventSchema = createEventSchema;

export const cancelEventSchema = z.object({
  reason: z.string().min(1).max(500),
});
