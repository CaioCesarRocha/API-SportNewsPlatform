import { randomUUID } from "node:crypto";
import path from "node:path";

import ImageKit, { toFile } from "@imagekit/nodejs";

import imageKitConfig from "../config/imagekit.config";

export type UploadImageParams = {
  file: Express.Multer.File;
  fileNamePrefix: string;
  folder: string;
  tags?: string[];
};

export type UploadedImage = {
  fileId: string;
  url: string;
};

export class ImageStorageNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageStorageNotConfiguredError";
  }
}

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadError";
  }
}

export class ImageStorageService {
  private readonly client: ImageKit | null;

  constructor() {
    this.client = imageKitConfig.privateKey
      ? new ImageKit({
          privateKey: imageKitConfig.privateKey,
        })
      : null;
  }

  private buildFileName(fileNamePrefix: string, originalName: string): string {
    const extension = path.extname(originalName).toLowerCase() || ".bin";
    const normalizedPrefix = fileNamePrefix
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

    return `${normalizedPrefix || "image"}-${randomUUID()}${extension}`;
  }

  async uploadImage(params: UploadImageParams): Promise<UploadedImage> {
    if (!this.client) {
      throw new ImageStorageNotConfiguredError("ImageKit is not configured.");
    }

    try {
      const fileName = this.buildFileName(params.fileNamePrefix, params.file.originalname);
      const file = await toFile(params.file.buffer, fileName);
      const response = await this.client.files.upload({
        file,
        fileName,
        folder: params.folder,
        isPrivateFile: false,
        tags: params.tags,
        useUniqueFileName: true,
      });

      if (!response.fileId || !response.url) {
        throw new ImageUploadError("Image upload did not return a valid file reference.");
      }

      return {
        fileId: response.fileId,
        url: response.url,
      };
    } catch (error) {
      if (error instanceof ImageUploadError) {
        throw error;
      }

      throw new ImageUploadError("Failed to upload image.");
    }
  }

  async deleteImage(fileId: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.files.delete(fileId);
    } catch {
      return;
    }
  }
}
