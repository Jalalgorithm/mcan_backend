import { Request } from "express";
import multer, { StorageEngine } from "multer";
import { UploadApiOptions } from "cloudinary";
import { cloudinary } from "../config/cloudinary";
import { ApiError } from "../utils/ApiError";

const ALLOWED_IMAGE_FOLDERS = ["members", "news", "events", "digital-id", "general"];

class CloudinaryStorage implements StorageEngine {
  constructor(private optionsFactory: (req: Request) => UploadApiOptions) {}

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: unknown, info?: Partial<Express.Multer.File>) => void
  ) {
    const uploadOptions = this.optionsFactory(req);
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
      if (err || !result) return cb(err);
      cb(null, {
        path: result.secure_url,
        filename: result.public_id,
        size: result.bytes,
        // @ts-expect-error — extra Cloudinary metadata attached for the controller
        width: result.width,
        height: result.height,
        format: result.format,
      });
    });
    file.stream.pipe(stream);
  }

  _removeFile(_req: Request, _file: Express.Multer.File, cb: (error: Error | null) => void) {
    cb(null);
  }
}

const imageStorage = new CloudinaryStorage((req) => {
  const requested = (req.body?.folder as string) || "general";
  const folder = ALLOWED_IMAGE_FOLDERS.includes(requested) ? requested : "general";
  return { folder: `mcan/${folder}`, resource_type: "image" };
});

const documentStorage = new CloudinaryStorage(() => ({
  folder: "mcan/documents",
  resource_type: "raw",
}));

const signatureStorage = new CloudinaryStorage(() => ({
  folder: "mcan/signatures",
  resource_type: "image",
  transformation: [{ width: 400, height: 200, crop: "fit", effect: "grayscale" }],
}));

export const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(ApiError.badRequest("Please upload a JPEG, PNG, or WebP image."));
    }
    cb(null, true);
  },
});

export const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(ApiError.badRequest("Please upload a PDF document."));
    }
    cb(null, true);
  },
});

export const uploadSignature = multer({
  storage: signatureStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      return cb(ApiError.badRequest("Please upload a JPEG or PNG image."));
    }
    cb(null, true);
  },
});
