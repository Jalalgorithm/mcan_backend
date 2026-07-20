import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import { statsQuerySchema } from "./stats.validation";
import * as statsController from "./stats.controller";

export const statsRouter = Router();

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin Stats]
 *     summary: Return summary statistics for the admin dashboard
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [7d, 30d, 90d, 365d, all], default: 30d }
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved
 */
statsRouter.get(
  "/stats",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ query: statsQuerySchema }),
  asyncHandler(statsController.getDashboard)
);
