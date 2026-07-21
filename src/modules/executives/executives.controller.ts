import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import * as executivesService from "./executives.service";

export async function list(_req: Request, res: Response) {
  const executives = await executivesService.listExecutives();
  sendSuccess(res, 200, "Executives retrieved", { executives });
}

export async function create(req: Request, res: Response) {
  const executive = await executivesService.createExecutive(req.body);
  sendSuccess(res, 201, "Executive created", { executive });
}

export async function update(req: Request, res: Response) {
  const executive = await executivesService.updateExecutive(Number(req.params.id), req.body);
  sendSuccess(res, 200, "Executive updated", { executive });
}

export async function remove(req: Request, res: Response) {
  await executivesService.deleteExecutive(Number(req.params.id));
  sendSuccess(res, 200, "Executive deleted");
}
