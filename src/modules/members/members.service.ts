import { pool } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { paginationMeta } from "../../utils/pagination";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const SELECT_COLUMNS = `
  id, first_name, last_name, email, phone, role, member_id, membership_type, status,
  state, chapter, occupation, profile_photo, digital_id_status, created_at, updated_at
`;

interface ListFilters {
  page: number;
  limit: number;
  sortBy: "createdAt" | "firstName" | "lastName";
  sortOrder: "asc" | "desc";
  search?: string;
  status?: string;
  membershipType?: string;
  state?: string;
  chapter?: string;
  digitalIdStatus?: string;
}

const SORT_COLUMN: Record<ListFilters["sortBy"], string> = {
  createdAt: "created_at",
  firstName: "first_name",
  lastName: "last_name",
};

function toMember(row: RowDataPacket) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    memberId: row.member_id,
    membershipType: row.membership_type,
    status: row.status,
    state: row.state,
    chapter: row.chapter,
    occupation: row.occupation,
    profilePhoto: row.profile_photo,
    digitalIdStatus: row.digital_id_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listMembers(filters: ListFilters) {
  const conditions: string[] = ["is_deleted = 0"];
  const params: unknown[] = [];

  if (filters.search) {
    conditions.push(
      "(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR member_id LIKE ?)"
    );
    const like = `%${filters.search}%`;
    params.push(like, like, like, like);
  }
  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  if (filters.membershipType) {
    conditions.push("membership_type = ?");
    params.push(filters.membershipType);
  }
  if (filters.state) {
    conditions.push("state = ?");
    params.push(filters.state);
  }
  if (filters.chapter) {
    conditions.push("chapter = ?");
    params.push(filters.chapter);
  }
  if (filters.digitalIdStatus) {
    conditions.push("digital_id_status = ?");
    params.push(filters.digitalIdStatus);
  }

  const whereClause = conditions.join(" AND ");
  const offset = (filters.page - 1) * filters.limit;
  const sortColumn = SORT_COLUMN[filters.sortBy];
  const sortDirection = filters.sortOrder === "asc" ? "ASC" : "DESC";

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM users WHERE ${whereClause}
     ORDER BY ${sortColumn} ${sortDirection} LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset]
  );
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM users WHERE ${whereClause}`,
    params
  );

  return {
    items: rows.map(toMember),
    meta: paginationMeta(countRows[0].total, filters.page, filters.limit),
  };
}

async function findByIdOrMemberId(identifier: string) {
  const isNumeric = /^\d+$/.test(identifier);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM users WHERE ${isNumeric ? "id" : "member_id"} = ? AND is_deleted = 0`,
    [identifier]
  );
  const member = rows[0];
  if (!member) throw ApiError.notFound("Member not found");
  return member;
}

export async function getMemberByIdentifier(identifier: string) {
  return toMember(await findByIdOrMemberId(identifier));
}

export async function updateMember(
  identifier: string,
  input: Record<string, unknown>,
  isAdmin: boolean
) {
  const existing = await findByIdOrMemberId(identifier);

  const fieldMap: Record<string, unknown> = {
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone,
    occupation: input.occupation,
    state: input.state,
    chapter: input.chapter,
  };

  if (isAdmin) {
    fieldMap.status = input.status;
    fieldMap.membership_type = input.membershipType;
    fieldMap.role = input.role;
  }

  const entries = Object.entries(fieldMap).filter(([, v]) => v !== undefined);
  if (entries.length > 0) {
    const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([, v]) => v);
    await pool.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, existing.id]);
  }

  return getMemberByIdentifier(String(existing.id));
}

export async function updateMemberStatus(identifier: string, status: string, _reason?: string) {
  const existing = await findByIdOrMemberId(identifier);
  await pool.query("UPDATE users SET status = ? WHERE id = ?", [status, existing.id]);
  return {
    memberId: existing.member_id,
    status,
    updatedAt: new Date().toISOString(),
  };
}

export async function updateMemberPhoto(identifier: string, photoUrl: string) {
  const existing = await findByIdOrMemberId(identifier);
  await pool.query("UPDATE users SET profile_photo = ? WHERE id = ?", [photoUrl, existing.id]);
  return photoUrl;
}

export async function softDeleteMember(identifier: string) {
  const existing = await findByIdOrMemberId(identifier);
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE users SET is_deleted = 1, status = 'deactivated' WHERE id = ?",
    [existing.id]
  );
  if (result.affectedRows === 0) throw ApiError.notFound("Member not found");
}
