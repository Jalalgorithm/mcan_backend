import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import { uploadImage } from "../../middleware/upload";
import { galleryIdParamSchema, gallerySchema } from "./gallery.validation";
import * as galleryController from "./gallery.controller";

export const galleryRouter = Router();

/**
 * @openapi
 * /gallery:
 *   get:
 *     tags: [Gallery]
 *     summary: List all gallery items (public)
 *     security: []
 *     responses:
 *       200:
 *         description: Gallery items retrieved
 */
galleryRouter.get("/", asyncHandler(galleryController.list));

/**
 * @openapi
 * /gallery/upload:
 *   post:
 *     tags: [Gallery]
 *     summary: Upload an image to use as a gallery item's src (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Image uploaded
 */
galleryRouter.post(
  "/upload",
  authGuard,
  roleGuard("admin", "superadmin"),
  uploadImage.single("file"),
  asyncHandler(galleryController.upload)
);

/**
 * @openapi
 * /gallery:
 *   post:
 *     tags: [Gallery]
 *     summary: Create a gallery item (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [src]
 *             properties:
 *               src: { type: string, format: uri }
 *               caption: { type: string }
 *               span: { type: string, enum: [wide, tall] }
 *     responses:
 *       201:
 *         description: Gallery item created
 */
galleryRouter.post(
  "/",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ body: gallerySchema }),
  asyncHandler(galleryController.create)
);

/**
 * @openapi
 * /gallery/{id}:
 *   put:
 *     tags: [Gallery]
 *     summary: Update a gallery item (admin only)
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
 *             required: [src]
 *             properties:
 *               src: { type: string, format: uri }
 *               caption: { type: string }
 *               span: { type: string, enum: [wide, tall] }
 *     responses:
 *       200:
 *         description: Gallery item updated
 */
galleryRouter.put(
  "/:id",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: galleryIdParamSchema, body: gallerySchema }),
  asyncHandler(galleryController.update)
);

/**
 * @openapi
 * /gallery/{id}:
 *   delete:
 *     tags: [Gallery]
 *     summary: Delete a gallery item (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Gallery item deleted
 */
galleryRouter.delete(
  "/:id",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: galleryIdParamSchema }),
  asyncHandler(galleryController.remove)
);
