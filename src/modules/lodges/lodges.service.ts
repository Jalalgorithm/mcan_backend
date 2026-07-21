import { pool } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface LodgeInput {
  name: string;
  photo?: string;
  address?: string;
  state?: string;
  capacity?: number;
  status: "Available" | "Limited" | "Full";
  coordinator?: string;
  phone?: string;
  map?: string;
}

function toLodge(row: RowDataPacket) {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo,
    address: row.address,
    state: row.state,
    capacity: row.capacity,
    status: row.status,
    coordinator: row.coordinator,
    phone: row.phone,
    map: row.map,
  };
}

export async function listLodges(filters: { status?: string; state?: string }) {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  if (filters.state) {
    conditions.push("state = ?");
    params.push(filters.state);
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM lodges WHERE ${conditions.join(" AND ")} ORDER BY name ASC`,
    params
  );
  return rows.map(toLodge);
}

async function getRawById(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM lodges WHERE id = ?", [id]);
  const item = rows[0];
  if (!item) throw ApiError.notFound("Lodge not found");
  return item;
}

export async function createLodge(input: LodgeInput) {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO lodges (name, photo, address, state, capacity, status, coordinator, phone, map)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.photo ?? null,
      input.address ?? null,
      input.state ?? null,
      input.capacity ?? null,
      input.status,
      input.coordinator ?? null,
      input.phone ?? null,
      input.map ?? null,
    ]
  );
  return toLodge(await getRawById(result.insertId));
}

export async function updateLodge(id: number, input: LodgeInput) {
  await getRawById(id);
  await pool.query(
    `UPDATE lodges SET name = ?, photo = ?, address = ?, state = ?, capacity = ?, status = ?,
       coordinator = ?, phone = ?, map = ? WHERE id = ?`,
    [
      input.name,
      input.photo ?? null,
      input.address ?? null,
      input.state ?? null,
      input.capacity ?? null,
      input.status,
      input.coordinator ?? null,
      input.phone ?? null,
      input.map ?? null,
      id,
    ]
  );
  return toLodge(await getRawById(id));
}

export async function deleteLodge(id: number) {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM lodges WHERE id = ?", [id]);
  if (result.affectedRows === 0) throw ApiError.notFound("Lodge not found");
}
