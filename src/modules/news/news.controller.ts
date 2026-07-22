import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import * as newsService from "./news.service";

function parseQuery(req: Request) {
  return req.validatedQuery as {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    category?: string;
    search?: string;
    featured?: boolean;
    status?: string;
  };
}

export async function list(req: Request, res: Response) {
  const filters = { ...parseQuery(req), publicOnly: true };
  const result = await newsService.listNews(filters);
  sendSuccess(res, 200, "News retrieved", { articles: result.items }, result.meta);
}

export async function listAdmin(req: Request, res: Response) {
  const filters = { ...parseQuery(req), publicOnly: false };
  const result = await newsService.listNews(filters);
  sendSuccess(res, 200, "News retrieved", { articles: result.items }, result.meta);
}

export async function getBySlug(req: Request, res: Response) {
  const article = await newsService.getNewsBySlug(String(req.params.slug), true);
  sendSuccess(res, 200, "Article retrieved", { article });
}

export async function create(req: Request, res: Response) {
  const article = await newsService.createNews(req.user!.id, req.body);
  sendSuccess(res, 201, "Article created successfully", { article });
}

export async function replace(req: Request, res: Response) {
  const article = await newsService.replaceNews(Number(req.params.id), req.body);
  sendSuccess(res, 200, "Article updated successfully", { article });
}

export async function publish(req: Request, res: Response) {
  const result = await newsService.publishNews(Number(req.params.id));
  sendSuccess(res, 200, "Article published successfully", result);
}

export async function unpublish(req: Request, res: Response) {
  const result = await newsService.unpublishNews(Number(req.params.id));
  sendSuccess(res, 200, "Article unpublished", result);
}

export async function remove(req: Request, res: Response) {
  await newsService.deleteNews(Number(req.params.id));
  sendSuccess(res, 200, "Article archived successfully");
}
