import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard, roleGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import {
  newsIdParamSchema,
  newsSlugParamSchema,
  listNewsQuerySchema,
  listNewsAdminQuerySchema,
  createNewsSchema,
  updateNewsSchema,
} from "./news.validation";
import * as newsController from "./news.controller";

export const newsRouter = Router();

/**
 * @openapi
 * /news:
 *   get:
 *     tags: [News]
 *     summary: List all published news articles (public)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [announcement, news, press-release, update] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: featured
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: News retrieved
 */
newsRouter.get("/", validate({ query: listNewsQuerySchema }), asyncHandler(newsController.list));

/**
 * @openapi
 * /news/admin/all:
 *   get:
 *     tags: [News]
 *     summary: List ALL articles (published + draft + archived) for admin management
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, published, archived] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: News retrieved
 */
newsRouter.get(
  "/admin/all",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ query: listNewsAdminQuerySchema }),
  asyncHandler(newsController.listAdmin)
);

/**
 * @openapi
 * /news/{slug}:
 *   get:
 *     tags: [News]
 *     summary: Get a single news article by its URL slug (public)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Article retrieved
 *       404:
 *         description: Not found or unpublished
 */
newsRouter.get(
  "/:slug",
  validate({ params: newsSlugParamSchema }),
  asyncHandler(newsController.getBySlug)
);

/**
 * @openapi
 * /news:
 *   post:
 *     tags: [News]
 *     summary: Create a new news article (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, excerpt, category]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               excerpt: { type: string }
 *               category: { type: string, enum: [announcement, news, press-release, update] }
 *               coverImage: { type: string, format: uri }
 *               tags: { type: array, items: { type: string } }
 *               featured: { type: boolean }
 *               status: { type: string, enum: [draft, published] }
 *     responses:
 *       201:
 *         description: Article created successfully
 */
newsRouter.post(
  "/",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ body: createNewsSchema }),
  asyncHandler(newsController.create)
);

/**
 * @openapi
 * /news/{id}:
 *   put:
 *     tags: [News]
 *     summary: Fully replace an existing article's content (admin only)
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
 *         description: Article updated successfully
 */
newsRouter.put(
  "/:id",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: newsIdParamSchema, body: updateNewsSchema }),
  asyncHandler(newsController.replace)
);

/**
 * @openapi
 * /news/{id}/publish:
 *   patch:
 *     tags: [News]
 *     summary: Publish a draft article (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Article published successfully
 */
newsRouter.patch(
  "/:id/publish",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: newsIdParamSchema }),
  asyncHandler(newsController.publish)
);

/**
 * @openapi
 * /news/{id}/unpublish:
 *   patch:
 *     tags: [News]
 *     summary: Unpublish a live article back to draft (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Article unpublished
 */
newsRouter.patch(
  "/:id/unpublish",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: newsIdParamSchema }),
  asyncHandler(newsController.unpublish)
);

/**
 * @openapi
 * /news/{id}:
 *   delete:
 *     tags: [News]
 *     summary: Soft-delete (archive) an article (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Article archived successfully
 */
newsRouter.delete(
  "/:id",
  authGuard,
  roleGuard("admin", "superadmin"),
  validate({ params: newsIdParamSchema }),
  asyncHandler(newsController.remove)
);
