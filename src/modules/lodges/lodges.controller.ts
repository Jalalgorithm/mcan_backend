import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import * as lodgesService from "./lodges.service";

export async function list(req: Request, res: Response) {
  const q = req.query as Record<string, string | undefined>;
  const lodges = await lodgesService.listLodges({ status: q.status, state: q.state });
  sendSuccess(res, 200, "Lodges retrieved", { lodges });
}

export async function create(req: Request, res: Response) {
  const lodge = await lodgesService.createLodge(req.body);
  sendSuccess(res, 201, "Lodge created", { lodge });
}

export async function update(req: Request, res: Response) {
  const lodge = await lodgesService.updateLodge(Number(req.params.id), req.body);
  sendSuccess(res, 200, "Lodge updated", { lodge });
}

export async function remove(req: Request, res: Response) {
  await lodgesService.deleteLodge(Number(req.params.id));
  sendSuccess(res, 200, "Lodge deleted");
}
