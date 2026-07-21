import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as programsController from "./programs.controller";

export const programsRouter = Router();

/**
 * @openapi
 * /programs:
 *   get:
 *     tags: [Programs]
 *     summary: List all programs (public)
 *     security: []
 *     responses:
 *       200:
 *         description: Programs retrieved
 */
programsRouter.get("/", asyncHandler(programsController.list));
