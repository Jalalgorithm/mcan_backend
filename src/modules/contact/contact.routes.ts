import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import { authRateLimiter } from "../../middleware/rateLimiter";
import { contactIdParamSchema, createContactSchema, listContactsQuerySchema } from "./contact.validation";
import * as contactController from "./contact.controller";

export const contactRouter = Router();

/**
 * @openapi
 * /contact:
 *   post:
 *     tags: [Contact]
 *     summary: Submit a contact form message (public)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, subject, category, message]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               subject: { type: string }
 *               category: { type: string, enum: [general, membership, events, partnership, complaint, other] }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Message received
 */
contactRouter.post(
  "/",
  authRateLimiter,
  validate({ body: createContactSchema }),
  asyncHandler(contactController.create)
);

/**
 * @openapi
 * /contact:
 *   get:
 *     tags: [Contact]
 *     summary: List all contact submissions (admin only)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: isRead
 *         schema: { type: boolean }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [general, membership, events, partnership, complaint, other] }
 *     responses:
 *       200:
 *         description: Contact messages retrieved
 */
contactRouter.get(
  "/",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ query: listContactsQuerySchema }),
  asyncHandler(contactController.list)
);

/**
 * @openapi
 * /contact/{id}:
 *   get:
 *     tags: [Contact]
 *     summary: Get a single contact message (admin only) — marks it as read automatically
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Message retrieved
 *       404:
 *         description: Not found
 */
contactRouter.get(
  "/:id",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: contactIdParamSchema }),
  asyncHandler(contactController.getById)
);

/**
 * @openapi
 * /contact/{id}/read:
 *   patch:
 *     tags: [Contact]
 *     summary: Explicitly mark a contact message as read (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Message marked as read
 */
contactRouter.patch(
  "/:id/read",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: contactIdParamSchema }),
  asyncHandler(contactController.markRead)
);

/**
 * @openapi
 * /contact/{id}:
 *   delete:
 *     tags: [Contact]
 *     summary: Permanently delete a contact submission (superadmin only, hard delete)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Contact message deleted
 */
contactRouter.delete(
  "/:id",
  authGuard,
  roleGuard("superadmin"),
  validate({ params: contactIdParamSchema }),
  asyncHandler(contactController.remove)
);
