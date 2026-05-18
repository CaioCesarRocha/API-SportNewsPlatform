import multer from "multer";
import { Request, RequestHandler, Response } from "express";

const MAX_IMAGE_SIZE_IN_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export class InvalidUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUploadError";
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_IN_BYTES,
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new InvalidUploadError(`${file.fieldname} must be a PNG, JPEG, or WebP image.`));
      return;
    }

    callback(null, true);
  },
});

function handleUploadError(error: unknown, response: Response, fieldName: string): Response | null {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return response.status(400).json({
        message: `${fieldName} must be at most 5 MB.`,
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return response.status(400).json({
        message: `${fieldName} is required.`,
      });
    }

    return response.status(400).json({
      message: "Invalid uploaded file.",
    });
  }

  if (error instanceof InvalidUploadError) {
    return response.status(400).json({
      message: error.message,
    });
  }

  if (error) {
    return response.status(500).json({
      message: "Failed to process uploaded file.",
    });
  }

  return null;
}

export function uploadImageField(fieldName: string): RequestHandler {
  return (request, response, next) => {
    upload.single(fieldName)(request, response, (error) => {
      const handledResponse = handleUploadError(error, response, fieldName);

      if (handledResponse) {
        return handledResponse;
      }

      return next();
    });
  };
}

export function requireUploadedFile(fieldName: string): RequestHandler {
  return (request: Request, response: Response, next) => {
    if (!request.file) {
      return response.status(400).json({
        message: `${fieldName} is required.`,
      });
    }

    return next();
  };
}
