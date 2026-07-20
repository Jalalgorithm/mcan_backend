import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { uploadImage, uploadDocument, uploadSignature } from "../../middleware/upload";
import * as uploadController from "./upload.controller";

export const uploadRouter = Router();

uploadRouter.use(authGuard);

/**
 * @openapi
 * /upload/image:
 *   post:
 *     tags: [Upload]
 *     summary: Upload a single image (profile photos, news/event covers)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *               folder: { type: string, enum: [members, news, events, digital-id, general] }
 *     responses:
 *       201:
 *         description: Image uploaded
 *       400:
 *         description: No file provided or file type not accepted
 */
uploadRouter.post("/image", uploadImage.single("file"), asyncHandler(uploadController.uploadImageHandler));

/**
 * @openapi
 * /upload/document:
 *   post:
 *     tags: [Upload]
 *     summary: Upload a PDF document
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
 *         description: Document uploaded
 */
uploadRouter.post(
  "/document",
  uploadDocument.single("file"),
  asyncHandler(uploadController.uploadDocumentHandler)
);

/**
 * @openapi
 * /upload/signature:
 *   post:
 *     tags: [Upload]
 *     summary: Upload a member's signature image for the Digital ID card
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
 *         description: Signature uploaded
 */
uploadRouter.post(
  "/signature",
  uploadSignature.single("file"),
  asyncHandler(uploadController.uploadSignatureHandler)
);

/**
 * @openapi
 * /upload/{publicId}:
 *   delete:
 *     tags: [Upload]
 *     summary: Delete a file from Cloudinary by its public ID (admin only)
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema: { type: string }
 *         description: URL-encoded Cloudinary public ID, e.g. members%2F64f1a2b3
 *     responses:
 *       200:
 *         description: File deleted
 */
uploadRouter.delete(
  "/:publicId",
  roleGuard("admin", "superadmin"),
  asyncHandler(uploadController.deleteFile)
);
