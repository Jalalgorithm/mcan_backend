import { pool } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { paginationMeta } from "../../utils/pagination";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function toDonation(row: RowDataPacket) {
  return {
    id: row.id,
    donor: row.donor,
    amount: currencyFormatter.format(Number(row.amount_value)),
    amountValue: Number(row.amount_value),
    purpose: row.purpose,
    date: row.donated_at,
    status: row.status,
  };
}

export async function listDonations(filters: {
  page: number;
  limit: number;
  status?: string;
}) {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  const whereClause = conditions.join(" AND ");
  const offset = (filters.page - 1) * filters.limit;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM donations WHERE ${whereClause} ORDER BY donated_at DESC LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset]
  );
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM donations WHERE ${whereClause}`,
    params
  );

  return {
    items: rows.map(toDonation),
    meta: paginationMeta(countRows[0].total, filters.page, filters.limit),
  };
}

async function getRawById(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM donations WHERE id = ?", [id]);
  const item = rows[0];
  if (!item) throw ApiError.notFound("Donation not found");
  return item;
}

export async function createDonation(input: {
  donor: string;
  amount: number;
  purpose?: string;
}) {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO donations (donor, amount_value, purpose, status) VALUES (?, ?, ?, 'Pending')",
    [input.donor, input.amount, input.purpose ?? null]
  );
  return toDonation(await getRawById(result.insertId));
}

export async function updateDonation(
  id: number,
  input: { donor?: string; amount?: number; purpose?: string; status?: string }
) {
  await getRawById(id);

  const fieldMap: Record<string, unknown> = {
    donor: input.donor,
    amount_value: input.amount,
    purpose: input.purpose,
    status: input.status,
  };
  const entries = Object.entries(fieldMap).filter(([, v]) => v !== undefined);
  if (entries.length > 0) {
    const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([, v]) => v);
    await pool.query(`UPDATE donations SET ${setClause} WHERE id = ?`, [...values, id]);
  }
  return toDonation(await getRawById(id));
}

export async function deleteDonation(id: number) {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM donations WHERE id = ?", [id]);
  if (result.affectedRows === 0) throw ApiError.notFound("Donation not found");
}

export async function getDonationStats() {
  const [[{ totalDonations }]] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS totalDonations FROM donations"
  );
  const [[{ raisedYear }]] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(amount_value), 0) AS raisedYear FROM donations
     WHERE status = 'Confirmed' AND YEAR(donated_at) = YEAR(NOW())`
  );
  const [[{ raisedMonth }]] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(amount_value), 0) AS raisedMonth FROM donations
     WHERE status = 'Confirmed' AND YEAR(donated_at) = YEAR(NOW()) AND MONTH(donated_at) = MONTH(NOW())`
  );

  return {
    totalDonations,
    raisedYear: Number(raisedYear),
    raisedMonth: Number(raisedMonth),
  };
}
