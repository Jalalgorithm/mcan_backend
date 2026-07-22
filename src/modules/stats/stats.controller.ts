import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import * as statsService from "./stats.service";

export async function getDashboard(req: Request, res: Response) {
  const period = (req.validatedQuery?.period as string) || "30d";
  const stats = await statsService.getDashboardStats(period);
  sendSuccess(res, 200, "Dashboard stats retrieved", stats);
}
