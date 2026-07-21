import { z } from "zod";

export const executiveIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const executiveSchema = z.object({
  name: z.string().min(1).max(150),
  role: z.string().min(1).max(150),
  photo: z.string().url().optional(),
  state: z.string().max(100).optional(),
});
