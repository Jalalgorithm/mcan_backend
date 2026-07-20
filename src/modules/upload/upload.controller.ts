import { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { cloudinary } from "../../config/cloudinary";

interface CloudinaryFile extends Express.Multer.File {
  filename: string;
  path: string;
  width?: number;
  height?: number;
  format?: string;
  size: number;
}

export async function uploadImageHandler(req: Request, res: Response) {
  const file = req.file as CloudinaryFile | undefined;
  if (!file) throw ApiError.badRequest("No file provided or file type not accepted");

  sendSuccess(res, 201, "Image uploaded successfully", {
    url: file.path,
    publicId: file.filename,
    width: file.width,
    height: file.height,
    format: file.format,
    size: file.size,
  });
}

export async function uploadDocumentHandler(req: Request, res: Response) {
  const file = req.file as CloudinaryFile | undefined;
  if (!file) throw ApiError.badRequest("No file provided or file type not accepted");

  sendSuccess(res, 201, "Document uploaded successfully", {
    url: file.path,
    publicId: file.filename,
    size: file.size,
  });
}

export async function uploadSignatureHandler(req: Request, res: Response) {
  const file = req.file as CloudinaryFile | undefined;
  if (!file) throw ApiError.badRequest("No file provided or file type not accepted");

  sendSuccess(res, 201, "Signature uploaded successfully", {
    url: file.path,
    publicId: file.filename,
  });
}

export async function deleteFile(req: Request, res: Response) {
  const publicId = decodeURIComponent(String(req.params.publicId));
  await cloudinary.uploader.destroy(publicId);
  sendSuccess(res, 200, "File deleted successfully", { publicId, deleted: true });
}
