import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import { executiveIdParamSchema, executiveSchema } from "./executives.validation";
import * as executivesController from "./executives.controller";

export const executivesRouter = Router();

/**
 * @openapi
 * /executives:
 *   get:
 *     tags: [Executives]
 *     summary: List all executives (public)
 *     security: []
 *     responses:
 *       200:
 *         description: Executives retrieved
 */
executivesRouter.get("/", asyncHandler(executivesController.list));

/**
 * @openapi
 * /executives:
 *   post:
 *     tags: [Executives]
 *     summary: Add an executive (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, role]
 *             properties:
 *               name: { type: string }
 *               role: { type: string }
 *               photo: { type: string, format: uri }
 *               state: { type: string }
 *     responses:
 *       201:
 *         description: Executive created
 */
executivesRouter.post(
  "/",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ body: executiveSchema }),
  asyncHandler(executivesController.create)
);

/**
 * @openapi
 * /executives/{id}:
 *   put:
 *     tags: [Executives]
 *     summary: Update an executive (admin only)
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
 *             required: [name, role]
 *             properties:
 *               name: { type: string }
 *               role: { type: string }
 *               photo: { type: string, format: uri }
 *               state: { type: string }
 *     responses:
 *       200:
 *         description: Executive updated
 */
executivesRouter.put(
  "/:id",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: executiveIdParamSchema, body: executiveSchema }),
  asyncHandler(executivesController.update)
);

/**
 * @openapi
 * /executives/{id}:
 *   delete:
 *     tags: [Executives]
 *     summary: Delete an executive (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Executive deleted
 */
executivesRouter.delete(
  "/:id",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: executiveIdParamSchema }),
  asyncHandler(executivesController.remove)
);
