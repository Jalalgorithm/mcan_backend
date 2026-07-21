import { z } from "zod";

export const galleryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const gallerySchema = z.object({
  src: z.string().url(),
  caption: z.string().max(255).optional(),
  span: z.enum(["wide", "tall"]).optional(),
});
