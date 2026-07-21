import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import {
  donationIdParamSchema,
  listDonationsQuerySchema,
  createDonationSchema,
  updateDonationSchema,
} from "./donations.validation";
import * as donationsController from "./donations.controller";

export const donationsRouter = Router();

donationsRouter.use(authGuard, roleGuard("admin", "superadmin"));

/**
 * @openapi
 * /donations:
 *   get:
 *     tags: [Donations]
 *     summary: List donations (admin only)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pending, Confirmed] }
 *     responses:
 *       200:
 *         description: Donations retrieved
 */
donationsRouter.get(
  "/",
  validate({ query: listDonationsQuerySchema }),
  asyncHandler(donationsController.list)
);

/**
 * @openapi
 * /donations/stats:
 *   get:
 *     tags: [Donations]
 *     summary: Get donation summary stats (admin only)
 *     responses:
 *       200:
 *         description: Donation stats retrieved
 */
donationsRouter.get("/stats", asyncHandler(donationsController.stats));

/**
 * @openapi
 * /donations:
 *   post:
 *     tags: [Donations]
 *     summary: Record a new donation (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [donor, amount]
 *             properties:
 *               donor: { type: string }
 *               amount: { type: number }
 *               purpose: { type: string }
 *     responses:
 *       201:
 *         description: Donation recorded
 */
donationsRouter.post(
  "/",
  validate({ body: createDonationSchema }),
  asyncHandler(donationsController.create)
);

/**
 * @openapi
 * /donations/{id}:
 *   patch:
 *     tags: [Donations]
 *     summary: Update a donation (admin only)
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
 *               donor: { type: string }
 *               amount: { type: number }
 *               purpose: { type: string }
 *               status: { type: string, enum: [Pending, Confirmed] }
 *     responses:
 *       200:
 *         description: Donation updated
 */
donationsRouter.patch(
  "/:id",
  validate({ params: donationIdParamSchema, body: updateDonationSchema }),
  asyncHandler(donationsController.update)
);

/**
 * @openapi
 * /donations/{id}:
 *   delete:
 *     tags: [Donations]
 *     summary: Delete a donation (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Donation deleted
 */
donationsRouter.delete(
  "/:id",
  validate({ params: donationIdParamSchema }),
  asyncHandler(donationsController.remove)
);
