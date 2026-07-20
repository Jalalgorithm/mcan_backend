import { pool } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { paginationMeta } from "../../utils/pagination";
import { slugify } from "../../utils/slugify";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { z } from "zod";
import { createEventSchema } from "./events.validation";

type EventInput = z.infer<typeof createEventSchema>;
type EventLocation = NonNullable<EventInput["location"]>;

const EMPTY_LOCATION: EventLocation = { isOnline: false };

interface ListFilters {
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
  upcoming?: boolean;
  past?: boolean;
  category?: string;
  state?: string;
  search?: string;
  status?: string;
  publicOnly: boolean;
}

function toEventSummary(row: RowDataPacket) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    coverImage: row.cover_image,
    location: {
      venue: row.location_venue,
      address: row.location_address,
      city: row.location_city,
      state: row.location_state,
      isOnline: !!row.is_online,
      onlineLink: row.online_link,
    },
    startDate: row.start_date,
    endDate: row.end_date,
    capacity: row.capacity,
    registeredCount: row.registered_count,
    isFree: !!row.is_free,
    price: row.price,
    organizerContact: row.organizer_contact,
    status: row.status,
    cancellationReason: row.cancellation_reason,
    createdAt: row.created_at,
  };
}

export async function listEvents(filters: ListFilters) {
  const conditions: string[] = ["is_deleted = 0"];
  const params: unknown[] = [];

  if (filters.publicOnly) {
    conditions.push("status = 'published'");
  } else if (filters.status && filters.status !== "past") {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  if (filters.upcoming) {
    conditions.push("start_date >= NOW()");
  }
  if (filters.past || filters.status === "past") {
    conditions.push("start_date < NOW()");
  }
  if (filters.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }
  if (filters.state) {
    conditions.push("location_state = ?");
    params.push(filters.state);
  }
  if (filters.search) {
    conditions.push("title LIKE ?");
    params.push(`%${filters.search}%`);
  }

  const whereClause = conditions.join(" AND ");
  const offset = (filters.page - 1) * filters.limit;
  const sortDirection = filters.sortOrder === "asc" ? "ASC" : "DESC";

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM events WHERE ${whereClause} ORDER BY start_date ${sortDirection} LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset]
  );
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM events WHERE ${whereClause}`,
    params
  );

  return {
    items: rows.map(toEventSummary),
    meta: paginationMeta(countRows[0].total, filters.page, filters.limit),
  };
}

export async function getEventBySlug(slug: string, publicOnly: boolean) {
  const conditions = ["slug = ?", "is_deleted = 0"];
  const params: unknown[] = [slug];
  if (publicOnly) conditions.push("status = 'published'");

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM events WHERE ${conditions.join(" AND ")}`,
    params
  );
  const item = rows[0];
  if (!item) throw ApiError.notFound("Event not found");
  return toEventSummary(item);
}

async function getRawById(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM events WHERE id = ? AND is_deleted = 0",
    [id]
  );
  const item = rows[0];
  if (!item) throw ApiError.notFound("Event not found");
  return item;
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let suffix = 1;
  while (true) {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM events WHERE slug = ?", [
      slug,
    ]);
    if (rows.length === 0) return slug;
    slug = `${base}-${++suffix}`;
  }
}

export async function createEvent(authorId: number, input: EventInput) {
  const slug = await uniqueSlug(input.title);
  const loc = input.location ?? EMPTY_LOCATION;
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO events
      (title, slug, description, category, cover_image, location_venue, location_address,
       location_city, location_state, is_online, online_link, start_date, end_date,
       capacity, is_free, price, organizer_contact, status, author_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.title,
      slug,
      input.description ?? null,
      input.category,
      input.coverImage ?? null,
      loc.venue ?? null,
      loc.address ?? null,
      loc.city ?? null,
      loc.state ?? null,
      loc.isOnline ?? false,
      loc.onlineLink ?? null,
      input.startDate,
      input.endDate ?? null,
      input.capacity ?? null,
      input.isFree,
      input.isFree ? 0 : input.price,
      input.organizerContact ?? null,
      input.status,
      authorId,
    ]
  );
  return toEventSummary(await getRawById(result.insertId));
}

export async function replaceEvent(id: number, input: EventInput) {
  await getRawById(id);
  const loc = input.location ?? EMPTY_LOCATION;
  await pool.query(
    `UPDATE events SET title = ?, description = ?, category = ?, cover_image = ?, location_venue = ?,
       location_address = ?, location_city = ?, location_state = ?, is_online = ?, online_link = ?,
       start_date = ?, end_date = ?, capacity = ?, is_free = ?, price = ?, organizer_contact = ?, status = ?
     WHERE id = ? AND is_deleted = 0`,
    [
      input.title,
      input.description ?? null,
      input.category,
      input.coverImage ?? null,
      loc.venue ?? null,
      loc.address ?? null,
      loc.city ?? null,
      loc.state ?? null,
      loc.isOnline ?? false,
      loc.onlineLink ?? null,
      input.startDate,
      input.endDate ?? null,
      input.capacity ?? null,
      input.isFree,
      input.isFree ? 0 : input.price,
      input.organizerContact ?? null,
      input.status,
      id,
    ]
  );
  return toEventSummary(await getRawById(id));
}

export async function publishEvent(id: number) {
  await getRawById(id);
  await pool.query("UPDATE events SET status = 'published' WHERE id = ?", [id]);
  return { eventId: id, status: "published" };
}

export async function cancelEvent(id: number, reason: string) {
  await getRawById(id);
  await pool.query("UPDATE events SET status = 'cancelled', cancellation_reason = ? WHERE id = ?", [
    reason,
    id,
  ]);
  return { eventId: id, status: "cancelled", cancellationReason: reason };
}

export async function deleteEvent(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE events SET is_deleted = 1 WHERE id = ? AND is_deleted = 0",
    [id]
  );
  if (result.affectedRows === 0) throw ApiError.notFound("Event not found");
}
