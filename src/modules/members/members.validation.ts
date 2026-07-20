import { z } from "zod";

export const memberIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listMembersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "firstName", "lastName"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  status: z.enum(["active", "pending", "suspended", "deactivated"]).optional(),
  membershipType: z.enum(["full", "associate", "student", "corporate"]).optional(),
  state: z.string().optional(),
  chapter: z.string().optional(),
  digitalIdStatus: z.enum(["none", "pending", "approved", "rejected", "revoked"]).optional(),
});

export const updateMemberSelfSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  state: z.string().optional(),
  chapter: z.string().optional(),
});

export const updateMemberAdminSchema = updateMemberSelfSchema.extend({
  status: z.enum(["active", "pending", "suspended", "deactivated"]).optional(),
  membershipType: z.enum(["full", "associate", "student", "corporate"]).optional(),
  role: z.enum(["member", "admin", "superadmin"]).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["active", "pending", "suspended", "deactivated"]),
  reason: z.string().max(500).optional(),
});
