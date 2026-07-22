import { pool } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { paginationMeta } from "../../utils/pagination";
import { slugify } from "../../utils/slugify";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { z } from "zod";
import { createNewsSchema } from "./news.validation";

type NewsInput = z.infer<typeof createNewsSchema>;

interface ListFilters {
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
  category?: string;
  search?: string;
  featured?: boolean;
  status?: string;
  publicOnly: boolean;
}

function toArticleSummary(row: RowDataPacket) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    category: row.category,
    coverImage: row.cover_image,
    author: { firstName: row.author_first_name, lastName: row.author_last_name },
    status: row.status,
    publishedAt: row.published_at,
    featured: !!row.featured,
    readTime: row.read_time,
  };
}

function toArticleDetail(row: RowDataPacket) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt,
    category: row.category,
    coverImage: row.cover_image,
    author: { id: row.author_id, firstName: row.author_first_name, lastName: row.author_last_name },
    tags: typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags,
    status: row.status,
    publishedAt: row.published_at,
    featured: !!row.featured,
    readTime: row.read_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const JOIN = `
  JOIN users u ON u.id = n.author_id
`;
const SELECT = `
  n.*, u.first_name AS author_first_name, u.last_name AS author_last_name
`;

export async function listNews(filters: ListFilters) {
  const conditions: string[] = ["n.is_deleted = 0"];
  const params: unknown[] = [];

  if (filters.publicOnly) {
    conditions.push("n.status = 'published'");
  } else if (filters.status) {
    conditions.push("n.status = ?");
    params.push(filters.status);
  }
  if (filters.category) {
    conditions.push("n.category = ?");
    params.push(filters.category);
  }
  if (filters.featured !== undefined) {
    conditions.push("n.featured = ?");
    params.push(filters.featured);
  }
  if (filters.search) {
    conditions.push("(n.title LIKE ? OR n.excerpt LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like);
  }

  const whereClause = conditions.join(" AND ");
  const offset = (filters.page - 1) * filters.limit;
  const sortColumn = filters.publicOnly ? "n.published_at" : "n.created_at";
  const sortDirection = filters.sortOrder === "asc" ? "ASC" : "DESC";

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT} FROM news n ${JOIN} WHERE ${whereClause}
     ORDER BY ${sortColumn} ${sortDirection} LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset]
  );
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM news n WHERE ${whereClause}`,
    params
  );

  return {
    items: rows.map(toArticleSummary),
    meta: paginationMeta(countRows[0].total, filters.page, filters.limit),
  };
}

export async function getNewsBySlug(slug: string, publicOnly: boolean) {
  const conditions = ["n.slug = ?", "n.is_deleted = 0"];
  const params: unknown[] = [slug];
  if (publicOnly) conditions.push("n.status = 'published'");

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT} FROM news n ${JOIN} WHERE ${conditions.join(" AND ")}`,
    params
  );
  const item = rows[0];
  if (!item) throw ApiError.notFound("Article with that slug does not exist or is unpublished");
  return toArticleDetail(item);
}

async function getRawById(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT} FROM news n ${JOIN} WHERE n.id = ? AND n.is_deleted = 0`,
    [id]
  );
  const item = rows[0];
  if (!item) throw ApiError.notFound("Article not found");
  return item;
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let suffix = 1;
  while (true) {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM news WHERE slug = ?", [
      slug,
    ]);
    if (rows.length === 0) return slug;
    slug = `${base}-${++suffix}`;
  }
}

export async function createNews(authorId: number, input: NewsInput) {
  const slug = await uniqueSlug(input.title);
  const readTime = estimateReadTime(input.content);
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO news (title, slug, content, excerpt, category, cover_image, author_id, tags, featured, status, published_at, read_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.title,
      slug,
      input.content,
      input.excerpt,
      input.category,
      input.coverImage ?? null,
      authorId,
      JSON.stringify(input.tags ?? []),
      input.featured,
      input.status,
      input.status === "published" ? new Date() : null,
      readTime,
    ]
  );
  return toArticleDetail(await getRawById(result.insertId));
}

export async function replaceNews(id: number, input: NewsInput) {
  const existing = await getRawById(id);
  const readTime = estimateReadTime(input.content);
  const publishedAt =
    input.status === "published" ? existing.published_at ?? new Date() : existing.published_at;

  await pool.query(
    `UPDATE news SET title = ?, content = ?, excerpt = ?, category = ?, cover_image = ?, tags = ?, featured = ?, status = ?, published_at = ?, read_time = ?
     WHERE id = ? AND is_deleted = 0`,
    [
      input.title,
      input.content,
      input.excerpt,
      input.category,
      input.coverImage ?? null,
      JSON.stringify(input.tags ?? []),
      input.featured,
      input.status,
      publishedAt,
      readTime,
      id,
    ]
  );
  return toArticleDetail(await getRawById(id));
}

export async function publishNews(id: number) {
  await getRawById(id);
  const publishedAt = new Date();
  await pool.query("UPDATE news SET status = 'published', published_at = ? WHERE id = ?", [
    publishedAt,
    id,
  ]);
  return { articleId: id, status: "published", publishedAt: publishedAt.toISOString() };
}

export async function unpublishNews(id: number) {
  await getRawById(id);
  await pool.query("UPDATE news SET status = 'draft' WHERE id = ?", [id]);
  return { articleId: id, status: "draft" };
}

export async function deleteNews(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE news SET is_deleted = 1, status = 'archived' WHERE id = ? AND is_deleted = 0",
    [id]
  );
  if (result.affectedRows === 0) throw ApiError.notFound("Article not found");
}
