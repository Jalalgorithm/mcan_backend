import { pool } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface GalleryInput {
  src: string;
  caption?: string;
  span?: "wide" | "tall";
}

function toGalleryItem(row: RowDataPacket) {
  return {
    id: row.id,
    src: row.src,
    caption: row.caption,
    span: row.span ?? undefined,
  };
}

export async function listGalleryItems() {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM gallery_items ORDER BY sort_order ASC, id DESC"
  );
  return rows.map(toGalleryItem);
}

async function getRawById(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM gallery_items WHERE id = ?", [
    id,
  ]);
  const item = rows[0];
  if (!item) throw ApiError.notFound("Gallery item not found");
  return item;
}

export async function createGalleryItem(input: GalleryInput) {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO gallery_items (src, caption, span) VALUES (?, ?, ?)",
    [input.src, input.caption ?? null, input.span ?? null]
  );
  return toGalleryItem(await getRawById(result.insertId));
}

export async function updateGalleryItem(id: number, input: GalleryInput) {
  await getRawById(id);
  await pool.query("UPDATE gallery_items SET src = ?, caption = ?, span = ? WHERE id = ?", [
    input.src,
    input.caption ?? null,
    input.span ?? null,
    id,
  ]);
  return toGalleryItem(await getRawById(id));
}

export async function deleteGalleryItem(id: number) {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM gallery_items WHERE id = ?", [
    id,
  ]);
  if (result.affectedRows === 0) throw ApiError.notFound("Gallery item not found");
}
