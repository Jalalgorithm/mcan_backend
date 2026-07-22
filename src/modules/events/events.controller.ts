import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import * as eventsService from "./events.service";

function parseQuery(req: Request) {
  return req.validatedQuery as {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    upcoming?: boolean;
    past?: boolean;
    category?: string;
    state?: string;
    search?: string;
    status?: string;
  };
}

export async function list(req: Request, res: Response) {
  const filters = { ...parseQuery(req), publicOnly: true };
  const result = await eventsService.listEvents(filters);
  sendSuccess(res, 200, "Events retrieved", { events: result.items }, result.meta);
}

export async function listAdmin(req: Request, res: Response) {
  const filters = { ...parseQuery(req), publicOnly: false };
  const result = await eventsService.listEvents(filters);
  sendSuccess(res, 200, "Events retrieved", { events: result.items }, result.meta);
}

export async function getBySlug(req: Request, res: Response) {
  const event = await eventsService.getEventBySlug(String(req.params.slug), true);
  sendSuccess(res, 200, "Event retrieved", { event });
}

export async function create(req: Request, res: Response) {
  const event = await eventsService.createEvent(req.user!.id, req.body);
  sendSuccess(res, 201, "Event created successfully", { event });
}

export async function replace(req: Request, res: Response) {
  const event = await eventsService.replaceEvent(Number(req.params.id), req.body);
  sendSuccess(res, 200, "Event updated successfully", { event });
}

export async function publish(req: Request, res: Response) {
  const result = await eventsService.publishEvent(Number(req.params.id));
  sendSuccess(res, 200, "Event published successfully", result);
}

export async function cancel(req: Request, res: Response) {
  const result = await eventsService.cancelEvent(Number(req.params.id), req.body.reason);
  sendSuccess(res, 200, "Event cancelled", result);
}

export async function remove(req: Request, res: Response) {
  await eventsService.deleteEvent(Number(req.params.id));
  sendSuccess(res, 200, "Event deleted successfully");
}
