import crypto from "crypto";
import { pool } from "../../config/db";
import { env } from "../../config/env";
import { sendMail } from "../../config/mailer";
import { ApiError } from "../../utils/ApiError";
import { paginationMeta } from "../../utils/pagination";
import { RowDataPacket, ResultSetHeader } from "mysql2";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function toAdmin(row: RowDataPacket) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    status: row.status,
    lastLogin: row.last_login,
    createdAt: row.created_at,
  };
}

export async function listAdminUsers(filters: {
  page: number;
  limit: number;
  role?: string;
  status?: string;
}) {
  const conditions = ["role IN ('admin', 'superadmin')", "is_deleted = 0"];
  const params: unknown[] = [];

  if (filters.role) {
    conditions.push("role = ?");
    params.push(filters.role);
  }
  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  const whereClause = conditions.join(" AND ");
  const offset = (filters.page - 1) * filters.limit;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM users WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset]
  );
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM users WHERE ${whereClause}`,
    params
  );

  return {
    items: rows.map(toAdmin),
    meta: paginationMeta(countRows[0].total, filters.page, filters.limit),
  };
}

export async function inviteAdmin(input: {
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "superadmin";
}) {
  const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE email = ?", [
    input.email,
  ]);
  if (existing.length > 0) throw ApiError.conflict("Email already registered");

  const inviteToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.query<ResultSetHeader>(
    `INSERT INTO users (first_name, last_name, email, role, status, invite_token_hash, invite_expires_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [input.firstName, input.lastName, input.email, input.role, hashToken(inviteToken), expiresAt]
  );

  const setupLink = `${env.FRONTEND_URL}/admin/accept-invite?token=${inviteToken}`;
  await sendMail(
    input.email,
    "You've been invited to MCAN Southwest admin",
    `<p>Hi ${input.firstName}, you have been invited as ${input.role}. Set up your account <a href="${setupLink}">here</a>. This link expires in 7 days.</p>`
  );

  return { invitedEmail: input.email, role: input.role, expiresAt: expiresAt.toISOString() };
}

export async function updateAdminRole(id: number, role: "admin" | "superadmin") {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE users SET role = ? WHERE id = ? AND role IN ('admin', 'superadmin') AND is_deleted = 0",
    [role, id]
  );
  if (result.affectedRows === 0) throw ApiError.notFound("Admin user not found");
  return { userId: id, role };
}

export async function deactivateAdmin(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE users SET status = 'deactivated' WHERE id = ? AND role IN ('admin', 'superadmin')",
    [id]
  );
  if (result.affectedRows === 0) throw ApiError.notFound("Admin user not found");
  await pool.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?", [id]);
}

export async function reactivateAdmin(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE users SET status = 'active' WHERE id = ? AND role IN ('admin', 'superadmin')",
    [id]
  );
  if (result.affectedRows === 0) throw ApiError.notFound("Admin user not found");
}
