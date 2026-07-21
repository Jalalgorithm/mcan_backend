import { z } from "zod";

export const sectionSchema = z.object({
  label: z.string().min(1),
  visible: z.boolean(),
});

export const updateWebContentSchema = z.object({
  headline: z.string().max(255).optional(),
  sections: z.array(sectionSchema).optional(),
});
