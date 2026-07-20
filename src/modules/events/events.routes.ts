import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import {
  eventIdParamSchema,
  eventSlugParamSchema,
  listEventsQuerySchema,
  listEventsAdminQuerySchema,
  createEventSchema,
  updateEventSchema,
  cancelEventSchema,
} from "./events.validation";
import * as eventsController from "./events.controller";

export const eventsRouter = Router();

/**
 * @openapi
 * /events:
 *   get:
 *     tags: [Events]
 *     summary: List all upcoming published events (public)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: upcoming
 *         schema: { type: boolean }
 *       - in: query
 *         name: past
 *         schema: { type: boolean }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [meeting, conference, seminar, workshop, social, other] }
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Events retrieved
 */
eventsRouter.get(
  "/",
  validate({ query: listEventsQuerySchema }),
  asyncHandler(eventsController.list)
);

/**
 * @openapi
 * /events/admin/all:
 *   get:
 *     tags: [Events]
 *     summary: List all events (all statuses) for admin management
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, published, cancelled, past] }
 *     responses:
 *       200:
 *         description: Events retrieved
 */
eventsRouter.get(
  "/admin/all",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ query: listEventsAdminQuerySchema }),
  asyncHandler(eventsController.listAdmin)
);

/**
 * @openapi
 * /events/{slug}:
 *   get:
 *     tags: [Events]
 *     summary: Get a single event's full detail (public)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event retrieved
 *       404:
 *         description: Not found
 */
eventsRouter.get(
  "/:slug",
  validate({ params: eventSlugParamSchema }),
  asyncHandler(eventsController.getBySlug)
);

/**
 * @openapi
 * /events:
 *   post:
 *     tags: [Events]
 *     summary: Create an event (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, startDate]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string, enum: [meeting, conference, seminar, workshop, social, other] }
 *               coverImage: { type: string, format: uri }
 *               location:
 *                 type: object
 *                 properties:
 *                   venue: { type: string }
 *                   address: { type: string }
 *                   city: { type: string }
 *                   state: { type: string }
 *                   isOnline: { type: boolean }
 *                   onlineLink: { type: string, format: uri, nullable: true }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *               capacity: { type: integer }
 *               isFree: { type: boolean }
 *               price: { type: number }
 *               organizerContact: { type: string }
 *               status: { type: string, enum: [draft, published, cancelled] }
 *     responses:
 *       201:
 *         description: Event created successfully
 */
eventsRouter.post(
  "/",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ body: createEventSchema }),
  asyncHandler(eventsController.create)
);

/**
 * @openapi
 * /events/{id}:
 *   put:
 *     tags: [Events]
 *     summary: Fully update an event (admin only)
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
 *     responses:
 *       200:
 *         description: Event updated successfully
 */
eventsRouter.put(
  "/:id",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: eventIdParamSchema, body: updateEventSchema }),
  asyncHandler(eventsController.replace)
);

/**
 * @openapi
 * /events/{id}/publish:
 *   patch:
 *     tags: [Events]
 *     summary: Publish a draft event (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Event published successfully
 */
eventsRouter.patch(
  "/:id/publish",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: eventIdParamSchema }),
  asyncHandler(eventsController.publish)
);

/**
 * @openapi
 * /events/{id}/cancel:
 *   patch:
 *     tags: [Events]
 *     summary: Cancel a published event (admin only)
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
 *         description: Event cancelled
 */
eventsRouter.patch(
  "/:id/cancel",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: eventIdParamSchema, body: cancelEventSchema }),
  asyncHandler(eventsController.cancel)
);

/**
 * @openapi
 * /events/{id}:
 *   delete:
 *     tags: [Events]
 *     summary: Soft-delete an event (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Event deleted successfully
 */
eventsRouter.delete(
  "/:id",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: eventIdParamSchema }),
  asyncHandler(eventsController.remove)
);
