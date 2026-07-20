import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import * as contactService from "./contact.service";

export async function create(req: Request, res: Response) {
  const result = await contactService.createContact(req.body);
  sendSuccess(res, 201, "Your message has been received. We will respond within 2 business days.", result);
}

export async function list(req: Request, res: Response) {
  const q = req.query as Record<string, string | undefined>;
  const result = await contactService.listContacts({
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 20,
    sortOrder: (q.sortOrder as "asc" | "desc") || "desc",
    isRead: q.isRead !== undefined ? q.isRead === "true" : undefined,
    category: q.category,
  });
  sendSuccess(res, 200, "Contact messages retrieved", { messages: result.items }, result.meta);
}

export async function getById(req: Request, res: Response) {
  const message = await contactService.getContactByIdAndMarkRead(Number(req.params.id));
  sendSuccess(res, 200, "Message retrieved", { message });
}

export async function markRead(req: Request, res: Response) {
  const result = await contactService.markContactRead(Number(req.params.id));
  sendSuccess(res, 200, "Message marked as read", result);
}

export async function remove(req: Request, res: Response) {
  await contactService.deleteContact(Number(req.params.id));
  sendSuccess(res, 200, "Contact message deleted");
}
