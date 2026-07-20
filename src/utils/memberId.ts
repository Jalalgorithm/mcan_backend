import { pool } from "../config/db";
import { RowDataPacket } from "mysql2";

export async function generateMemberId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MCAN-SW-${year}-`;

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT member_id FROM users WHERE member_id LIKE ? ORDER BY member_id DESC LIMIT 1",
    [`${prefix}%`]
  );

  const last = rows[0]?.member_id as string | undefined;
  const nextSeq = last ? parseInt(last.slice(prefix.length), 10) + 1 : 1;

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}
