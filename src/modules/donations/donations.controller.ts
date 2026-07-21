import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import * as donationsService from "./donations.service";

export async function list(req: Request, res: Response) {
  const q = req.query as Record<string, string | undefined>;
  const result = await donationsService.listDonations({
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 20,
    status: q.status,
  });
  sendSuccess(res, 200, "Donations retrieved", { donations: result.items }, result.meta);
}

export async function create(req: Request, res: Response) {
  const donation = await donationsService.createDonation(req.body);
  sendSuccess(res, 201, "Donation recorded", { donation });
}

export async function update(req: Request, res: Response) {
  const donation = await donationsService.updateDonation(Number(req.params.id), req.body);
  sendSuccess(res, 200, "Donation updated", { donation });
}

export async function remove(req: Request, res: Response) {
  await donationsService.deleteDonation(Number(req.params.id));
  sendSuccess(res, 200, "Donation deleted");
}

export async function stats(_req: Request, res: Response) {
  const result = await donationsService.getDonationStats();
  sendSuccess(res, 200, "Donation stats retrieved", result);
}
