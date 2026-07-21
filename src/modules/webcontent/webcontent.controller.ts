import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import * as webContentService from "./webcontent.service";

export async function get(_req: Request, res: Response) {
  const content = await webContentService.getWebContent();
  sendSuccess(res, 200, "Web content retrieved", content);
}

export async function update(req: Request, res: Response) {
  const content = await webContentService.updateWebContent(req.body);
  sendSuccess(res, 200, "Web content updated", content);
}
