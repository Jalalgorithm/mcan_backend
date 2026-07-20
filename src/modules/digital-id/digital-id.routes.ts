import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import {
  digitalIdParamSchema,
  listDigitalIdsQuerySchema,
  requestDigitalIdSchema,
  approveDigitalIdSchema,
  rejectDigitalIdSchema,
  revokeDigitalIdSchema,
} from "./digital-id.validation";
import * as digitalIdController from "./digital-id.controller";

export const digitalIdRouter = Router();

digitalIdRouter.use(authGuard);

/**
 * @openapi
 * /digital-id/request:
 *   post:
 *     tags: [Digital ID]
 *     summary: Submit a request for a digital ID card (member's own account must be active)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passportPhoto]
 *             properties:
 *               passportPhoto: { type: string, format: uri }
 *               signature: { type: string, format: uri }
 *               additionalNote: { type: string }
 *     responses:
 *       201:
 *         description: Digital ID request submitted successfully
 *       403:
 *         description: Member account is not active
 *       409:
 *         description: Member already has a pending or active digital ID
 */
digitalIdRouter.post(
  "/request",
  validate({ body: requestDigitalIdSchema }),
  asyncHandler(digitalIdController.request)
);

/**
 * @openapi
 * /digital-id/my-id:
 *   get:
 *     tags: [Digital ID]
 *     summary: Get the authenticated member's own digital ID request and status
 *     responses:
 *       200:
 *         description: Digital ID retrieved
 *       404:
 *         description: No request found
 */
digitalIdRouter.get("/my-id", asyncHandler(digitalIdController.getMyId));

/**
 * @openapi
 * /digital-id:
 *   get:
 *     tags: [Digital ID]
 *     summary: List all digital ID requests (admin only)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, revoked] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by memberId or name
 *     responses:
 *       200:
 *         description: Digital ID requests retrieved
 */
digitalIdRouter.get(
  "/",
  roleGuard("admin", "superadmin"),
  validate({ query: listDigitalIdsQuerySchema }),
  asyncHandler(digitalIdController.list)
);

/**
 * @openapi
 * /digital-id/{id}:
 *   get:
 *     tags: [Digital ID]
 *     summary: Get a single digital ID request's full details (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Digital ID request retrieved
 */
digitalIdRouter.get(
  "/:id",
  roleGuard("admin", "superadmin"),
  validate({ params: digitalIdParamSchema }),
  asyncHandler(digitalIdController.getById)
);

/**
 * @openapi
 * /digital-id/{id}/approve:
 *   patch:
 *     tags: [Digital ID]
 *     summary: Approve a pending request — generates card PNG + PDF and emails the member (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note: { type: string }
 *     responses:
 *       200:
 *         description: Digital ID approved and card generated successfully
 *       400:
 *         description: Request is not in pending status
 */
digitalIdRouter.patch(
  "/:id/approve",
  roleGuard("admin", "superadmin"),
  validate({ params: digitalIdParamSchema, body: approveDigitalIdSchema }),
  asyncHandler(digitalIdController.approve)
);

/**
 * @openapi
 * /digital-id/{id}/reject:
 *   patch:
 *     tags: [Digital ID]
 *     summary: Reject a pending request and notify the member (admin only)
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
 *             required: [reason]
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Request rejected and member notified
 *       400:
 *         description: Request is not in pending status
 */
digitalIdRouter.patch(
  "/:id/reject",
  roleGuard("admin", "superadmin"),
  validate({ params: digitalIdParamSchema, body: rejectDigitalIdSchema }),
  asyncHandler(digitalIdController.reject)
);

/**
 * @openapi
 * /digital-id/{id}/download/image:
 *   get:
 *     tags: [Digital ID]
 *     summary: Get a time-limited signed download URL for the card PNG (own card, or admin for any)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Download link generated
 *       400:
 *         description: Digital ID has not been approved yet
 *       403:
 *         description: Not your own digital ID
 */
digitalIdRouter.get(
  "/:id/download/image",
  validate({ params: digitalIdParamSchema }),
  asyncHandler(digitalIdController.downloadImage)
);

/**
 * @openapi
 * /digital-id/{id}/download/pdf:
 *   get:
 *     tags: [Digital ID]
 *     summary: Get a time-limited signed download URL for the card PDF (own card, or admin for any)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Download link generated
 */
digitalIdRouter.get(
  "/:id/download/pdf",
  validate({ params: digitalIdParamSchema }),
  asyncHandler(digitalIdController.downloadPdf)
);

/**
 * @openapi
 * /digital-id/{id}/revoke:
 *   patch:
 *     tags: [Digital ID]
 *     summary: Revoke an issued digital ID (superadmin only)
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
 *             required: [reason]
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Digital ID revoked
 */
digitalIdRouter.patch(
  "/:id/revoke",
  roleGuard("superadmin"),
  validate({ params: digitalIdParamSchema, body: revokeDigitalIdSchema }),
  asyncHandler(digitalIdController.revoke)
);
