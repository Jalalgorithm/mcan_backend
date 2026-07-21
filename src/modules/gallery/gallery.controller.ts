import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import * as galleryService from "./gallery.service";

export async function list(_req: Request, res: Response) {
  const gallery = await galleryService.listGalleryItems();
  sendSuccess(res, 200, "Gallery items retrieved", { gallery });
}

export async function create(req: Request, res: Response) {
  const item = await galleryService.createGalleryItem(req.body);
  sendSuccess(res, 201, "Gallery item created", { item });
}

export async function update(req: Request, res: Response) {
  const item = await galleryService.updateGalleryItem(Number(req.params.id), req.body);
  sendSuccess(res, 200, "Gallery item updated", { item });
}

export async function remove(req: Request, res: Response) {
  await galleryService.deleteGalleryItem(Number(req.params.id));
  sendSuccess(res, 200, "Gallery item deleted");
}

export async function upload(req: Request, res: Response) {
  const file = req.file as (Express.Multer.File & { path: string; filename: string }) | undefined;
  if (!file) throw ApiError.badRequest("No file provided or file type not accepted");

  sendSuccess(res, 201, "Image uploaded successfully", {
    url: file.path,
    publicId: file.filename,
  });
}
