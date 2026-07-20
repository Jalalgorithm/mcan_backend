import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import * as adminUsersService from "./admin-users.service";

export async function list(req: Request, res: Response) {
  const q = req.query as Record<string, string | undefined>;
  const result = await adminUsersService.listAdminUsers({
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 20,
    role: q.role,
    status: q.status,
  });
  sendSuccess(res, 200, "Admins retrieved", { admins: result.items }, result.meta);
}

export async function invite(req: Request, res: Response) {
  const result = await adminUsersService.inviteAdmin(req.body);
  sendSuccess(res, 201, `Admin invitation sent to ${result.invitedEmail}`, result);
}

export async function updateRole(req: Request, res: Response) {
  const result = await adminUsersService.updateAdminRole(Number(req.params.id), req.body.role);
  sendSuccess(res, 200, `Role updated to ${result.role}`, result);
}

export async function deactivate(req: Request, res: Response) {
  await adminUsersService.deactivateAdmin(Number(req.params.id));
  sendSuccess(res, 200, "Admin account deactivated");
}

export async function reactivate(req: Request, res: Response) {
  await adminUsersService.reactivateAdmin(Number(req.params.id));
  sendSuccess(res, 200, "Admin account reactivated");
}
