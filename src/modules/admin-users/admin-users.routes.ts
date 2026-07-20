import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import {
  adminUserIdParamSchema,
  listAdminUsersQuerySchema,
  inviteAdminSchema,
  updateRoleSchema,
} from "./admin-users.validation";
import * as adminUsersController from "./admin-users.controller";

export const adminUsersRouter = Router();

adminUsersRouter.use(authGuard, roleGuard("superadmin"));

/**
 * @openapi
 * /admin-users:
 *   get:
 *     tags: [Admin Users]
 *     summary: List all admin and super admin accounts (superadmin only)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, superadmin] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, pending, suspended, deactivated] }
 *     responses:
 *       200:
 *         description: Admins retrieved
 */
adminUsersRouter.get(
  "/",
  validate({ query: listAdminUsersQuerySchema }),
  asyncHandler(adminUsersController.list)
);

/**
 * @openapi
 * /admin-users/invite:
 *   post:
 *     tags: [Admin Users]
 *     summary: Invite a new admin user via email (superadmin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, role]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               role: { type: string, enum: [admin, superadmin] }
 *     responses:
 *       201:
 *         description: Admin invitation sent
 *       409:
 *         description: Email already registered
 */
adminUsersRouter.post(
  "/invite",
  validate({ body: inviteAdminSchema }),
  asyncHandler(adminUsersController.invite)
);

/**
 * @openapi
 * /admin-users/{id}/role:
 *   patch:
 *     tags: [Admin Users]
 *     summary: Update an admin user's role (superadmin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, superadmin] }
 *     responses:
 *       200:
 *         description: Role updated
 */
adminUsersRouter.patch(
  "/:id/role",
  validate({ params: adminUserIdParamSchema, body: updateRoleSchema }),
  asyncHandler(adminUsersController.updateRole)
);

/**
 * @openapi
 * /admin-users/{id}/deactivate:
 *   patch:
 *     tags: [Admin Users]
 *     summary: Deactivate an admin account (superadmin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Admin account deactivated
 */
adminUsersRouter.patch(
  "/:id/deactivate",
  validate({ params: adminUserIdParamSchema }),
  asyncHandler(adminUsersController.deactivate)
);

/**
 * @openapi
 * /admin-users/{id}/reactivate:
 *   patch:
 *     tags: [Admin Users]
 *     summary: Reactivate a previously deactivated admin account (superadmin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Admin account reactivated
 */
adminUsersRouter.patch(
  "/:id/reactivate",
  validate({ params: adminUserIdParamSchema }),
  asyncHandler(adminUsersController.reactivate)
);
