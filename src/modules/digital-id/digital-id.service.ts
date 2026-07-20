import { pool } from "../../config/db";
import { sendMail } from "../../config/mailer";
import { cloudinary } from "../../config/cloudinary";
import { ApiError } from "../../utils/ApiError";
import { paginationMeta } from "../../utils/pagination";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { generateDigitalIdCard } from "./card-generator";

interface MemberRow extends RowDataPacket {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  member_id: string;
  membership_type: string;
  status: string;
  state: string;
  chapter: string;
}

function toRequestSummary(row: RowDataPacket) {
  return {
    id: row.id,
    member: {
      id: row.member_id_fk,
      firstName: row.first_name,
      lastName: row.last_name,
      memberId: row.member_id,
      membershipType: row.membership_type,
      state: row.state,
      chapter: row.chapter,
    },
    passportPhoto: row.passport_photo,
    status: row.status,
    submittedAt: row.submitted_at,
  };
}

function toRequestDetail(row: RowDataPacket) {
  return {
    id: row.id,
    memberId: row.mcan_member_id,
    status: row.status,
    passportPhoto: row.passport_photo,
    signature: row.signature,
    cardImageUrl: row.card_image_url,
    cardPdfUrl: row.card_pdf_url,
    issuedAt: row.issued_at,
    expiryDate: row.expiry_date,
    approvedBy: row.approved_by,
    rejectionReason: row.rejection_reason,
    revocationReason: row.revocation_reason,
    additionalNote: row.additional_note,
    submittedAt: row.submitted_at,
  };
}

const JOIN = `
  JOIN users u ON u.id = d.member_id
`;
const SELECT = `
  d.*, u.first_name, u.last_name, u.member_id AS mcan_member_id, u.membership_type, u.state, u.chapter, d.member_id AS member_id_fk
`;

export async function requestDigitalId(
  memberId: number,
  input: { passportPhoto: string; signature?: string; additionalNote?: string }
) {
  const [memberRows] = await pool.query<MemberRow[]>(
    "SELECT * FROM users WHERE id = ? AND is_deleted = 0",
    [memberId]
  );
  const member = memberRows[0];
  if (!member) throw ApiError.notFound("Member not found");
  if (member.status !== "active") throw ApiError.forbidden("Member account is not active");

  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM digital_ids WHERE member_id = ? AND status IN ('pending', 'approved')",
    [memberId]
  );
  if (existing.length > 0) {
    throw ApiError.conflict("Member already has a pending or active digital ID");
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO digital_ids (member_id, passport_photo, signature, additional_note, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [memberId, input.passportPhoto, input.signature ?? null, input.additionalNote ?? null]
  );
  await pool.query("UPDATE users SET digital_id_status = 'pending' WHERE id = ?", [memberId]);

  return {
    requestId: result.insertId,
    memberId: member.member_id,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
}

export async function getMyDigitalId(memberId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT} FROM digital_ids d ${JOIN} WHERE d.member_id = ? ORDER BY d.submitted_at DESC LIMIT 1`,
    [memberId]
  );
  const item = rows[0];
  if (!item) throw ApiError.notFound("No digital ID request found");
  return toRequestDetail(item);
}

export async function listDigitalIds(filters: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}) {
  const conditions = ["d.is_deleted = 0"];
  const params: unknown[] = [];

  if (filters.status) {
    conditions.push("d.status = ?");
    params.push(filters.status);
  }
  if (filters.search) {
    conditions.push("(u.member_id LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }

  const whereClause = conditions.join(" AND ");
  const offset = (filters.page - 1) * filters.limit;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT} FROM digital_ids d ${JOIN} WHERE ${whereClause}
     ORDER BY d.submitted_at DESC LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset]
  );
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM digital_ids d ${JOIN} WHERE ${whereClause}`,
    params
  );

  return {
    items: rows.map(toRequestSummary),
    meta: paginationMeta(countRows[0].total, filters.page, filters.limit),
  };
}

async function getRawById(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT} FROM digital_ids d ${JOIN} WHERE d.id = ?`,
    [id]
  );
  const item = rows[0];
  if (!item) throw ApiError.notFound("Digital ID request not found");
  return item;
}

export async function getDigitalIdById(id: number) {
  return toRequestDetail(await getRawById(id));
}

export async function approveDigitalId(id: number, approverId: number, note?: string) {
  const row = await getRawById(id);
  if (row.status !== "pending") throw ApiError.badRequest("Request is not in pending status");

  const issuedAt = new Date();
  const expiryDate = new Date(issuedAt);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const card = await generateDigitalIdCard({
    memberId: row.mcan_member_id,
    firstName: row.first_name,
    lastName: row.last_name,
    membershipType: row.membership_type,
    chapter: row.chapter,
    state: row.state,
    expiryDate,
    passportPhotoUrl: row.passport_photo,
  });

  await pool.query(
    `UPDATE digital_ids SET status = 'approved', card_image_url = ?, card_pdf_url = ?,
       card_image_public_id = ?, card_pdf_public_id = ?, issued_at = ?, expiry_date = ?,
       approved_by = ?, approval_note = ?
     WHERE id = ?`,
    [
      card.cardImageUrl,
      card.cardPdfUrl,
      card.cardImagePublicId,
      card.cardPdfPublicId,
      issuedAt,
      expiryDate,
      approverId,
      note ?? null,
      id,
    ]
  );
  await pool.query("UPDATE users SET digital_id_status = 'approved' WHERE id = ?", [
    row.member_id_fk,
  ]);

  const memberEmail = await getMemberEmail(row.member_id_fk);
  await sendMail(
    memberEmail,
    "Your MCAN Digital ID has been approved",
    `<p>Congratulations! Your digital ID card is ready. <a href="${card.cardImageUrl}">View card</a> or <a href="${card.cardPdfUrl}">download PDF</a>.</p>`
  );

  return {
    requestId: id,
    status: "approved",
    cardImageUrl: card.cardImageUrl,
    cardPdfUrl: card.cardPdfUrl,
    issuedAt: issuedAt.toISOString(),
    expiryDate: expiryDate.toISOString(),
    approvedBy: approverId,
    memberNotified: true,
  };
}

export async function rejectDigitalId(id: number, reason: string) {
  const row = await getRawById(id);
  if (row.status !== "pending") throw ApiError.badRequest("Request is not in pending status");

  await pool.query("UPDATE digital_ids SET status = 'rejected', rejection_reason = ? WHERE id = ?", [
    reason,
    id,
  ]);
  await pool.query("UPDATE users SET digital_id_status = 'rejected' WHERE id = ?", [
    row.member_id_fk,
  ]);

  const memberEmail = await getMemberEmail(row.member_id_fk);
  const rejectedAt = new Date();
  await sendMail(
    memberEmail,
    "Your MCAN Digital ID request was not approved",
    `<p>Reason: ${reason}</p><p>You may submit a new request with updated information.</p>`
  );

  return {
    requestId: id,
    status: "rejected",
    reason,
    rejectedAt: rejectedAt.toISOString(),
    memberNotified: true,
  };
}

export async function revokeDigitalId(id: number, reason: string) {
  const row = await getRawById(id);
  if (row.status !== "approved") throw ApiError.badRequest("Only an approved digital ID can be revoked");

  await pool.query("UPDATE digital_ids SET status = 'revoked', revocation_reason = ? WHERE id = ?", [
    reason,
    id,
  ]);
  await pool.query("UPDATE users SET digital_id_status = 'revoked' WHERE id = ?", [
    row.member_id_fk,
  ]);

  return { requestId: id, status: "revoked", revokedAt: new Date().toISOString() };
}

export async function getDownloadUrl(id: number, kind: "image" | "pdf", requesterId: number, isAdmin: boolean) {
  const row = await getRawById(id);
  if (!isAdmin && row.member_id_fk !== requesterId) {
    throw ApiError.forbidden("You may only download your own digital ID card");
  }
  if (row.status !== "approved") throw ApiError.badRequest("Digital ID has not been approved yet");

  const publicId = kind === "image" ? row.card_image_public_id : row.card_pdf_public_id;
  if (!publicId) throw ApiError.notFound("No approved digital ID found for this request");

  const expiresIn = 600;
  const downloadUrl = cloudinary.utils.private_download_url(publicId, kind === "image" ? "png" : "pdf", {
    resource_type: kind === "image" ? "image" : "raw",
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
  });

  return {
    downloadUrl,
    expiresIn,
    fileName: `MCAN-Digital-ID-${row.mcan_member_id}.${kind === "image" ? "png" : "pdf"}`,
  };
}

async function getMemberEmail(memberId: number): Promise<string> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT email FROM users WHERE id = ?", [
    memberId,
  ]);
  return rows[0]?.email;
}
