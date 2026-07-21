import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import { updateWebContentSchema } from "./webcontent.validation";
import * as webContentController from "./webcontent.controller";

export const webContentRouter = Router();

/**
 * @openapi
 * /webcontent:
 *   get:
 *     tags: [Web Content]
 *     summary: Get site-wide web content (headline + section visibility) — public
 *     security: []
 *     responses:
 *       200:
 *         description: Web content retrieved
 */
webContentRouter.get("/", asyncHandler(webContentController.get));

/**
 * @openapi
 * /webcontent:
 *   post:
 *     tags: [Web Content]
 *     summary: Create/update site-wide web content (admin only)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               headline: { type: string }
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label: { type: string }
 *                     visible: { type: boolean }
 *     responses:
 *       200:
 *         description: Web content saved
 */
webContentRouter.post(
  "/",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ body: updateWebContentSchema }),
  asyncHandler(webContentController.update)
);

/**
 * @openapi
 * /webcontent:
 *   put:
 *     tags: [Web Content]
 *     summary: Update site-wide web content (admin only)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               headline: { type: string }
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label: { type: string }
 *                     visible: { type: boolean }
 *     responses:
 *       200:
 *         description: Web content updated
 */
webContentRouter.put(
  "/",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ body: updateWebContentSchema }),
  asyncHandler(webContentController.update)
);
