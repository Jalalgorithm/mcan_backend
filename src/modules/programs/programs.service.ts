import { pool } from "../../config/db";
import { RowDataPacket } from "mysql2";

function toProgram(row: RowDataPacket) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    icon: row.icon,
    type: row.type,
    link: row.link ?? undefined,
  };
}

export async function listPrograms() {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM programs ORDER BY sort_order ASC, id ASC"
  );
  return rows.map(toProgram);
}
