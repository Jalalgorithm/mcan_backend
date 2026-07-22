import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import * as authService from "./auth.service";

const REFRESH_COOKIE = "refreshToken";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req: Request, res: Response) {
  const user = await authService.registerUser(req.body);
  sendSuccess(res, 201, "Registration successful. Please check your email to verify your account.", { user });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  setRefreshCookie(res, result.refreshToken);
  sendSuccess(res, 200, "Login successful", {
    accessToken: result.accessToken,
    user: result.user,
  });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("No refresh token cookie present");

  const result = await authService.refreshSession(token);
  setRefreshCookie(res, result.refreshToken);
  sendSuccess(res, 200, "Token refreshed", { accessToken: result.accessToken });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await authService.logoutUser(token);
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth/refresh" });
  sendSuccess(res, 200, "Logged out successfully");
}

export async function me(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.id);
  sendSuccess(res, 200, "Profile retrieved", { user });
}

export async function changePassword(req: Request, res: Response) {
  await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  sendSuccess(res, 200, "Password changed successfully. Please log in again.");
}

export async function verifyEmail(req: Request, res: Response) {
  await authService.verifyEmail(String(req.validatedQuery?.token));
  sendSuccess(res, 200, "Email verified successfully.");
}

export async function resendVerification(req: Request, res: Response) {
  await authService.resendVerificationEmail(req.body.email);
  sendSuccess(res, 200, "If that email is registered and unverified, a new verification link has been sent.");
}

export async function forgotPassword(req: Request, res: Response) {
  await authService.forgotPassword(req.body.email);
  sendSuccess(res, 200, "If that email is registered, a password reset link has been sent.");
}

export async function resetPassword(req: Request, res: Response) {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  sendSuccess(res, 200, "Password reset successful. You can now log in with your new password.");
}
