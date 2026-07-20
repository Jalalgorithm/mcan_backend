import { z } from "zod";

export const newsIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const newsSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export const listNewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  category: z.enum(["announcement", "news", "press-release", "update"]).optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
});

export const listNewsAdminQuerySchema = listNewsQuerySchema.extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export const createNewsSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(50),
  excerpt: z.string().max(300),
  category: z.enum(["announcement", "news", "press-release", "update"]),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const updateNewsSchema = createNewsSchema;
