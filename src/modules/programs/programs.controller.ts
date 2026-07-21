import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import * as programsService from "./programs.service";

export async function list(_req: Request, res: Response) {
  const programs = await programsService.listPrograms();
  sendSuccess(res, 200, "Programs retrieved", { programs });
}
