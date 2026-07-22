import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import * as membersService from "./members.service";

function isSelfOrAdmin(req: Request, identifier: string) {
  if (!req.user) return false;
  if (req.user.role === "admin" || req.user.role === "superadmin") return true;
  return String(req.user.id) === identifier;
}

export async function list(req: Request, res: Response) {
  const result = await membersService.listMembers(req.validatedQuery as never);
  sendSuccess(res, 200, "Members retrieved", { members: result.items }, result.meta);
}

export async function getById(req: Request, res: Response) {
  const identifier = String(req.params.id);
  const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";

  if (!isAdmin) {
    const member = await membersService.getMemberByIdentifier(identifier);
    if (String(member.id) !== String(req.user!.id) && member.memberId !== identifier) {
      throw ApiError.forbidden("You may only view your own profile");
    }
    return sendSuccess(res, 200, "Member retrieved", { member });
  }

  const member = await membersService.getMemberByIdentifier(identifier);
  sendSuccess(res, 200, "Member retrieved", { member });
}

export async function update(req: Request, res: Response) {
  const identifier = String(req.params.id);
  const isAdmin = req.user!.role === "admin" || req.user!.role === "superadmin";

  if (!isSelfOrAdmin(req, identifier)) {
    throw ApiError.forbidden("You may only update your own profile");
  }

  const member = await membersService.updateMember(identifier, req.body, isAdmin);
  sendSuccess(res, 200, "Profile updated successfully", { member });
}

export async function updateStatus(req: Request, res: Response) {
  const result = await membersService.updateMemberStatus(
    String(req.params.id),
    req.body.status,
    req.body.reason
  );
  sendSuccess(res, 200, `Member status updated to ${result.status}`, result);
}

export async function updatePhoto(req: Request, res: Response) {
  const identifier = String(req.params.id);
  if (!isSelfOrAdmin(req, identifier)) {
    throw ApiError.forbidden("You may only update your own photo");
  }
  const file = req.file as Express.Multer.File & { path: string };
  if (!file) throw ApiError.badRequest("No photo provided");

  const profilePhoto = await membersService.updateMemberPhoto(identifier, file.path);
  sendSuccess(res, 200, "Profile photo updated", { profilePhoto });
}

export async function remove(req: Request, res: Response) {
  await membersService.softDeleteMember(String(req.params.id));
  sendSuccess(res, 200, "Member account deactivated successfully");
}
