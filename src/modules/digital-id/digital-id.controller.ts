import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import * as digitalIdService from "./digital-id.service";

function isAdmin(req: Request) {
  return req.user!.role === "admin" || req.user!.role === "superadmin";
}

export async function request(req: Request, res: Response) {
  const result = await digitalIdService.requestDigitalId(req.user!.id, req.body);
  sendSuccess(res, 201, "Digital ID request submitted successfully. You will be notified once approved.", result);
}

export async function getMyId(req: Request, res: Response) {
  const digitalId = await digitalIdService.getMyDigitalId(req.user!.id);
  sendSuccess(res, 200, "Digital ID retrieved", { digitalId });
}

export async function list(req: Request, res: Response) {
  const result = await digitalIdService.listDigitalIds(req.validatedQuery as never);
  sendSuccess(res, 200, "Digital ID requests retrieved", { requests: result.items }, result.meta);
}

export async function getById(req: Request, res: Response) {
  const digitalId = await digitalIdService.getDigitalIdById(Number(req.params.id));
  sendSuccess(res, 200, "Digital ID request retrieved", { digitalId });
}

export async function approve(req: Request, res: Response) {
  const result = await digitalIdService.approveDigitalId(
    Number(req.params.id),
    req.user!.id,
    req.body.note
  );
  sendSuccess(res, 200, "Digital ID approved and card generated successfully", result);
}

export async function reject(req: Request, res: Response) {
  const result = await digitalIdService.rejectDigitalId(Number(req.params.id), req.body.reason);
  sendSuccess(res, 200, "Request rejected and member notified", result);
}

export async function revoke(req: Request, res: Response) {
  const result = await digitalIdService.revokeDigitalId(Number(req.params.id), req.body.reason);
  sendSuccess(res, 200, "Digital ID revoked", result);
}

export async function downloadImage(req: Request, res: Response) {
  const result = await digitalIdService.getDownloadUrl(
    Number(req.params.id),
    "image",
    req.user!.id,
    isAdmin(req)
  );
  sendSuccess(res, 200, "Download link generated", result);
}

export async function downloadPdf(req: Request, res: Response) {
  const result = await digitalIdService.getDownloadUrl(
    Number(req.params.id),
    "pdf",
    req.user!.id,
    isAdmin(req)
  );
  sendSuccess(res, 200, "Download link generated", result);
}
