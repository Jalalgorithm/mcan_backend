import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authGuard } from "../../middleware/authGuard";
import { validate } from "../../middleware/validate";
import { authRateLimiter } from "../../middleware/rateLimiter";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation";
import * as authController from "./auth.controller";

export const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new member account (status starts as "pending")
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, phone, password, confirmPassword, state, chapter, membershipType]
 *             properties:
 *               firstName: { type: string, example: Fatima }
 *               lastName: { type: string, example: Bello }
 *               email: { type: string, format: email }
 *               phone: { type: string, example: "+2348012345678" }
 *               password: { type: string, format: password, minLength: 8 }
 *               confirmPassword: { type: string, format: password }
 *               state: { type: string, example: Lagos }
 *               chapter: { type: string, example: Lagos Island }
 *               occupation: { type: string, example: Engineer }
 *               membershipType: { type: string, enum: [full, associate, student, corporate] }
 *     responses:
 *       201:
 *         description: Registration successful
 *       409:
 *         description: Email already registered
 *       422:
 *         description: Validation error
 */
authRouter.post(
  "/register",
  authRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register)
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and receive an access token (refresh token set as httpOnly cookie)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account deactivated or suspended
 */
authRouter.post(
  "/login",
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login)
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current refresh token and clear the cookie
 *     responses:
 *       200:
 *         description: Logged out
 */
authRouter.post("/logout", authGuard, asyncHandler(authController.logout));

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate the refresh token cookie and issue a new access token
 *     security: []
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Missing or expired refresh token
 *       403:
 *         description: Refresh token invalid or revoked
 */
authRouter.post("/refresh", asyncHandler(authController.refresh));

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user's profile
 *     responses:
 *       200:
 *         description: Profile retrieved
 */
authRouter.get("/me", authGuard, asyncHandler(authController.me));

/**
 * @openapi
 * /auth/change-password:
 *   patch:
 *     tags: [Auth]
 *     summary: Change the authenticated user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmNewPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *               confirmNewPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         description: Current password incorrect
 *       422:
 *         description: Validation error
 */
authRouter.patch(
  "/change-password",
  authGuard,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword)
);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Send a password reset link to the user's registered email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset link sent (always 200, does not reveal whether email exists)
 */
authRouter.post(
  "/forgot-password",
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(authController.forgotPassword)
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using the token from the reset email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword, confirmNewPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, format: password }
 *               confirmNewPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Token invalid or expired
 *       422:
 *         description: Validation error
 */
authRouter.post(
  "/reset-password",
  validate({ body: resetPasswordSchema }),
  asyncHandler(authController.resetPassword)
);
