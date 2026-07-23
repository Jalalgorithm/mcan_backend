import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError";
import { logger } from "../config/logger";

const MULTER_MESSAGES: Partial<Record<MulterError["code"], string>> = {
  LIMIT_FILE_SIZE: "That file is too large. Please upload a smaller one.",
  LIMIT_UNEXPECTED_FILE: "Unexpected file field — please check what you're uploading.",
};

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: { code: err.code, details: err.details ?? null },
    });
  }

  if (err instanceof MulterError) {
    return res.status(400).json({
      success: false,
      message: MULTER_MESSAGES[err.code] ?? "There was a problem with your file upload.",
      error: { code: "BAD_REQUEST", details: null },
    });
  }

  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");

  return res.status(500).json({
    success: false,
    message: "Something went wrong on our end. Please try again in a moment.",
    error: { code: "INTERNAL_ERROR", details: null },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `We couldn't find ${req.method} ${req.path}. Double-check the URL — most endpoints live under /api.`,
    error: { code: "NOT_FOUND", details: null },
  });
}
