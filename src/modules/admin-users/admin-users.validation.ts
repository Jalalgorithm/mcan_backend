import { z } from "zod";

export const adminUserIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listAdminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(["admin", "superadmin"]).optional(),
  status: z.enum(["active", "pending", "suspended", "deactivated"]).optional(),
});

export const inviteAdminSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  role: z.enum(["admin", "superadmin"]),
});

export const updateRoleSchema = z.object({
  role: z.enum(["admin", "superadmin"]),
});
