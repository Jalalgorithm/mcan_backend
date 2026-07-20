import { pool } from "../../config/db";
import { sendMail } from "../../config/mailer";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { paginationMeta } from "../../utils/pagination";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { z } from "zod";
import { createContactSchema } from "./contact.validation";

type CreateContactInput = z.infer<typeof createContactSchema>;

function toMessage(row: RowDataPacket) {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    category: row.category,
    message: row.message,
    isRead: !!row.is_read,
    createdAt: row.created_at,
  };
}

function generateTicketId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `CONTACT-${year}-${random}`;
}

export async function createContact(input: CreateContactInput) {
  const ticketId = generateTicketId();
  await pool.query<ResultSetHeader>(
    `INSERT INTO contacts (ticket_id, first_name, last_name, email, phone, subject, category, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ticketId,
      input.firstName,
      input.lastName,
      input.email,
      input.phone ?? null,
      input.subject,
      input.category,
      input.message,
    ]
  );

  await sendMail(
    env.ADMIN_EMAIL,
    `New contact submission: ${input.subject}`,
    `<p>${input.firstName} ${input.lastName} (${input.email}) submitted a ${input.category} message.</p><p>${input.message}</p>`
  );
  await sendMail(
    input.email,
    "We received your message — MCAN Southwest",
    `<p>Hi ${input.firstName}, thanks for reaching out. Your ticket ID is <strong>${ticketId}</strong>. We will respond within 2 business days.</p>`
  );

  return { ticketId, submittedAt: new Date().toISOString() };
}

export async function listContacts(filters: {
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
  isRead?: boolean;
  category?: string;
}) {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filters.isRead !== undefined) {
    conditions.push("is_read = ?");
    params.push(filters.isRead);
  }
  if (filters.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }

  const whereClause = conditions.join(" AND ");
  const offset = (filters.page - 1) * filters.limit;
  const sortDirection = filters.sortOrder === "asc" ? "ASC" : "DESC";

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM contacts WHERE ${whereClause} ORDER BY created_at ${sortDirection} LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset]
  );
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM contacts WHERE ${whereClause}`,
    params
  );

  return {
    items: rows.map(toMessage),
    meta: paginationMeta(countRows[0].total, filters.page, filters.limit),
  };
}

export async function getContactByIdAndMarkRead(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM contacts WHERE id = ?", [id]);
  const item = rows[0];
  if (!item) throw ApiError.notFound("Contact message not found");

  if (!item.is_read) {
    await pool.query("UPDATE contacts SET is_read = 1, read_at = NOW() WHERE id = ?", [id]);
    item.is_read = 1;
  }
  return toMessage(item);
}

export async function markContactRead(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE contacts SET is_read = 1, read_at = NOW() WHERE id = ?",
    [id]
  );
  if (result.affectedRows === 0) throw ApiError.notFound("Contact message not found");
  return { id, isRead: true };
}

export async function deleteContact(id: number) {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM contacts WHERE id = ?", [id]);
  if (result.affectedRows === 0) throw ApiError.notFound("Contact message not found");
}
