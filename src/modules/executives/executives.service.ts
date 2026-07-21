import { pool } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface ExecutiveInput {
  name: string;
  role: string;
  photo?: string;
  state?: string;
}

function toExecutive(row: RowDataPacket) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    photo: row.photo,
    state: row.state,
  };
}

export async function listExecutives() {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM executives ORDER BY sort_order ASC, id ASC"
  );
  return rows.map(toExecutive);
}

async function getRawById(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM executives WHERE id = ?", [id]);
  const item = rows[0];
  if (!item) throw ApiError.notFound("Executive not found");
  return item;
}

export async function createExecutive(input: ExecutiveInput) {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO executives (name, role, photo, state) VALUES (?, ?, ?, ?)",
    [input.name, input.role, input.photo ?? null, input.state ?? null]
  );
  return toExecutive(await getRawById(result.insertId));
}

export async function updateExecutive(id: number, input: ExecutiveInput) {
  await getRawById(id);
  await pool.query("UPDATE executives SET name = ?, role = ?, photo = ?, state = ? WHERE id = ?", [
    input.name,
    input.role,
    input.photo ?? null,
    input.state ?? null,
    id,
  ]);
  return toExecutive(await getRawById(id));
}

export async function deleteExecutive(id: number) {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM executives WHERE id = ?", [id]);
  if (result.affectedRows === 0) throw ApiError.notFound("Executive not found");
}
