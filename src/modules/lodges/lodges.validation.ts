import { z } from "zod";

export const lodgeIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listLodgesQuerySchema = z.object({
  status: z.enum(["Available", "Limited", "Full"]).optional(),
  state: z.string().optional(),
});

export const lodgeSchema = z.object({
  name: z.string().min(1).max(200),
  photo: z.string().url().optional(),
  address: z.string().max(500).optional(),
  state: z.string().max(100).optional(),
  capacity: z.coerce.number().int().nonnegative().optional(),
  status: z.enum(["Available", "Limited", "Full"]).default("Available"),
  coordinator: z.string().max(150).optional(),
  phone: z.string().max(30).optional(),
  map: z.string().url().optional(),
});
