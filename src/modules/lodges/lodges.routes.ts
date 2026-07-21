import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import { lodgeIdParamSchema, listLodgesQuerySchema, lodgeSchema } from "./lodges.validation";
import * as lodgesController from "./lodges.controller";

export const lodgesRouter = Router();

/**
 * @openapi
 * /lodges:
 *   get:
 *     tags: [Lodges]
 *     summary: List lodges (public)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Available, Limited, Full] }
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lodges retrieved
 */
lodgesRouter.get(
  "/",
  validate({ query: listLodgesQuerySchema }),
  asyncHandler(lodgesController.list)
);

/**
 * @openapi
 * /lodges:
 *   post:
 *     tags: [Lodges]
 *     summary: Create a lodge (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               photo: { type: string, format: uri }
 *               address: { type: string }
 *               state: { type: string }
 *               capacity: { type: integer }
 *               status: { type: string, enum: [Available, Limited, Full] }
 *               coordinator: { type: string }
 *               phone: { type: string }
 *               map: { type: string, format: uri }
 *     responses:
 *       201:
 *         description: Lodge created
 */
lodgesRouter.post(
  "/",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ body: lodgeSchema }),
  asyncHandler(lodgesController.create)
);

/**
 * @openapi
 * /lodges/{id}:
 *   put:
 *     tags: [Lodges]
 *     summary: Update a lodge (admin only)
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
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               photo: { type: string, format: uri }
 *               address: { type: string }
 *               state: { type: string }
 *               capacity: { type: integer }
 *               status: { type: string, enum: [Available, Limited, Full] }
 *               coordinator: { type: string }
 *               phone: { type: string }
 *               map: { type: string, format: uri }
 *     responses:
 *       200:
 *         description: Lodge updated
 */
lodgesRouter.put(
  "/:id",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: lodgeIdParamSchema, body: lodgeSchema }),
  asyncHandler(lodgesController.update)
);

/**
 * @openapi
 * /lodges/{id}:
 *   delete:
 *     tags: [Lodges]
 *     summary: Delete a lodge (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lodge deleted
 */
lodgesRouter.delete(
  "/:id",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: lodgeIdParamSchema }),
  asyncHandler(lodgesController.remove)
);
