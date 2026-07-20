import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db";
import { env } from "../../config/env";
import { sendMail } from "../../config/mailer";
import { ApiError } from "../../utils/ApiError";
import { generateMemberId } from "../../utils/memberId";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface UserRow extends RowDataPacket {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  phone: string;
  role: "member" | "admin" | "superadmin";
  member_id: string | null;
  membership_type: string | null;
  status: "active" | "pending" | "suspended" | "deactivated";
  state: string | null;
  chapter: string | null;
  occupation: string | null;
  profile_photo: string | null;
  digital_id_status: string;
  created_at: string;
  updated_at: string;
}

const BCRYPT_COST = 12;

function signAccessToken(userId: number, role: string) {
  return jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions["expiresIn"],
  });
}

function signRefreshToken(userId: number) {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions["expiresIn"],
  });
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    memberId: user.member_id,
    membershipType: user.membership_type,
    status: user.status,
    state: user.state,
    chapter: user.chapter,
    occupation: user.occupation,
    profilePhoto: user.profile_photo,
    digitalIdStatus: user.digital_id_status,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export async function registerUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  state: string;
  chapter: string;
  occupation?: string;
  membershipType: "full" | "associate" | "student" | "corporate";
}) {
  const [existing] = await pool.query<UserRow[]>("SELECT id FROM users WHERE email = ?", [
    input.email,
  ]);
  if (existing.length > 0) throw ApiError.conflict("Email already registered");

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const memberId = await generateMemberId();

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users
      (first_name, last_name, email, phone, password_hash, role, member_id, membership_type, status, state, chapter, occupation)
     VALUES (?, ?, ?, ?, ?, 'member', ?, ?, 'pending', ?, ?, ?)`,
    [
      input.firstName,
      input.lastName,
      input.email,
      input.phone,
      passwordHash,
      memberId,
      input.membershipType,
      input.state,
      input.chapter,
      input.occupation ?? null,
    ]
  );

  await sendMail(
    input.email,
    "Welcome to MCAN Southwest",
    `<p>Hi ${input.firstName}, your registration was received. Your member ID is <strong>${memberId}</strong>. Your account is pending review.</p>`
  );

  return {
    id: result.insertId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    role: "member",
    memberId,
    membershipType: input.membershipType,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

export async function loginUser(email: string, password: string) {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT * FROM users WHERE email = ? AND is_deleted = 0",
    [email]
  );
  const user = rows[0];
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  if (user.status === "suspended" || user.status === "deactivated") {
    throw ApiError.forbidden("Account deactivated or suspended");
  }

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [user.id, hashToken(refreshToken), expiresAt]
  );
  await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

  return { accessToken, refreshToken, user: toPublicUser(user) };
}

export async function refreshSession(refreshToken: string) {
  let payload: { sub: number };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as unknown as { sub: number };
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM refresh_tokens WHERE user_id = ? AND token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()",
    [payload.sub, tokenHash]
  );
  if (rows.length === 0) throw ApiError.forbidden("Refresh token is invalid or revoked");

  const [userRows] = await pool.query<UserRow[]>(
    "SELECT id, role FROM users WHERE id = ? AND is_deleted = 0",
    [payload.sub]
  );
  const user = userRows[0];
  if (!user) throw ApiError.unauthorized("User not found");

  await pool.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?", [
    tokenHash,
  ]);

  const newAccessToken = signAccessToken(user.id, user.role);
  const newRefreshToken = signRefreshToken(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [user.id, hashToken(newRefreshToken), expiresAt]
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(refreshToken: string) {
  await pool.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?", [
    hashToken(refreshToken),
  ]);
}

export async function getMe(userId: number) {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT * FROM users WHERE id = ? AND is_deleted = 0",
    [userId]
  );
  const user = rows[0];
  if (!user) throw ApiError.notFound("User not found");
  return toPublicUser(user);
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE id = ?", [userId]);
  const user = rows[0];
  if (!user) throw ApiError.notFound("User not found");

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw ApiError.unauthorized("Current password is incorrect");

  const newHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, userId]);
  await pool.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?", [userId]);
}

export async function forgotPassword(email: string) {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT id, first_name FROM users WHERE email = ? AND is_deleted = 0",
    [email]
  );
  const user = rows[0];
  if (!user) return; // do not reveal whether the email exists

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await pool.query(
    "UPDATE users SET password_reset_token_hash = ?, password_reset_expiry = ? WHERE id = ?",
    [tokenHash, expiry, user.id]
  );

  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendMail(
    email,
    "Reset your MCAN Southwest password",
    `<p>Hi ${user.first_name}, click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`
  );
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token);
  const [rows] = await pool.query<UserRow[]>(
    "SELECT id FROM users WHERE password_reset_token_hash = ? AND password_reset_expiry > NOW()",
    [tokenHash]
  );
  const user = rows[0];
  if (!user) throw ApiError.badRequest("Reset token is invalid or has expired");

  const newHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await pool.query(
    "UPDATE users SET password_hash = ?, password_reset_token_hash = NULL, password_reset_expiry = NULL WHERE id = ?",
    [newHash, user.id]
  );
  await pool.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?", [user.id]);
}
