import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import { uploadImage } from "../../middleware/upload";
import {
  memberIdParamSchema,
  listMembersQuerySchema,
  updateMemberSelfSchema,
  updateMemberAdminSchema,
  updateStatusSchema,
} from "./members.validation";
import * as membersController from "./members.controller";

export const membersRouter = Router();

membersRouter.use(authGuard);

/**
 * @openapi
 * /members:
 *   get:
 *     tags: [Members]
 *     summary: List all members with pagination and filtering (admin only)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, firstName, lastName], default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Searches firstName, lastName, email, memberId
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, pending, suspended, deactivated] }
 *       - in: query
 *         name: membershipType
 *         schema: { type: string, enum: [full, associate, student, corporate] }
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *       - in: query
 *         name: chapter
 *         schema: { type: string }
 *       - in: query
 *         name: digitalIdStatus
 *         schema: { type: string, enum: [none, pending, approved, rejected, revoked] }
 *     responses:
 *       200:
 *         description: Members retrieved
 */
membersRouter.get(
  "/",
  roleGuard("admin", "superadmin"),
  validate({ query: listMembersQuerySchema }),
  asyncHandler(membersController.list)
);

/**
 * @openapi
 * /members/{id}:
 *   get:
 *     tags: [Members]
 *     summary: Get a single member's full profile (own profile, or admin for any)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Numeric user id or memberId (e.g. MCAN-SW-2026-0001)
 *     responses:
 *       200:
 *         description: Member retrieved
 *       403:
 *         description: Member trying to view another member's profile
 *       404:
 *         description: Member not found
 */
membersRouter.get(
  "/:id",
  validate({ params: memberIdParamSchema }),
  asyncHandler(membersController.getById)
);

/**
 * @openapi
 * /members/{id}:
 *   patch:
 *     tags: [Members]
 *     summary: Update a member's profile (own profile, or admin for any field)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               occupation: { type: string }
 *               state: { type: string }
 *               chapter: { type: string }
 *               status: { type: string, enum: [active, pending, suspended, deactivated], description: "Admin only" }
 *               membershipType: { type: string, enum: [full, associate, student, corporate], description: "Admin only" }
 *               role: { type: string, enum: [member, admin, superadmin], description: "Admin only" }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       403:
 *         description: Attempting to update restricted fields
 *       404:
 *         description: Member not found
 */
membersRouter.patch(
  "/:id",
  validate({ params: memberIdParamSchema, body: updateMemberAdminSchema.or(updateMemberSelfSchema) }),
  asyncHandler(membersController.update)
);

/**
 * @openapi
 * /members/{id}/status:
 *   patch:
 *     tags: [Members]
 *     summary: Quick update of a member's status only (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, pending, suspended, deactivated] }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Member status updated
 */
membersRouter.patch(
  "/:id/status",
  roleGuard("admin", "superadmin"),
  validate({ params: memberIdParamSchema, body: updateStatusSchema }),
  asyncHandler(membersController.updateStatus)
);

/**
 * @openapi
 * /members/{id}/photo:
 *   patch:
 *     tags: [Members]
 *     summary: Upload or replace a member's profile photo (own profile, or admin for any)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Profile photo updated
 */
membersRouter.patch(
  "/:id/photo",
  validate({ params: memberIdParamSchema }),
  uploadImage.single("photo"),
  asyncHandler(membersController.updatePhoto)
);

/**
 * @openapi
 * /members/{id}:
 *   delete:
 *     tags: [Members]
 *     summary: Soft-delete (deactivate) a member account (superadmin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Member account deactivated successfully
 */
membersRouter.delete(
  "/:id",
  roleGuard("superadmin"),
  validate({ params: memberIdParamSchema }),
  asyncHandler(membersController.remove)
);
