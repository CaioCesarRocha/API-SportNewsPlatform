import { Request, Response } from "express";

import { ClubService, CreateClubPayload } from "../services/club.service";
import {
  ImageStorageNotConfiguredError,
  ImageStorageService,
  ImageUploadError,
} from "../services/image-storage.service";

type DatabaseError = {
  code?: string;
  constraint?: string;
  cause?: DatabaseError;
};

export class ClubController {
  constructor(
    private readonly clubService: ClubService,
    private readonly imageStorageService: ImageStorageService,
  ) {}

  private getDatabaseError(error: unknown): DatabaseError {
    return error as DatabaseError;
  }

  private async deleteUploadedImage(fileId: string | null): Promise<void> {
    if (!fileId) {
      return;
    }

    await this.imageStorageService.deleteImage(fileId);
  }

  createClub = async (request: Request, response: Response): Promise<Response> => {
    let uploadedImageId: string | null = null;

    try {
      const payload = request.body as Omit<CreateClubPayload, "shield">;

      const uploadedImage = await this.imageStorageService.uploadImage({
        file: request.file as Express.Multer.File,
        fileNamePrefix: payload.name,
        folder: "/clubs/shields",
        tags: ["club", "shield"],
      });

      uploadedImageId = uploadedImage.fileId;

      const club = await this.clubService.createClub({
        name: payload.name,
        country: payload.country,
        state: payload.state,
        shield: uploadedImage.url,
        stadium: payload.stadium,
      });

      return response.status(201).json(club);
    } catch (error) {
      await this.deleteUploadedImage(uploadedImageId);

      if (error instanceof ImageStorageNotConfiguredError) {
        return response.status(500).json({
          message: "ImageKit upload is not configured.",
        });
      }

      if (error instanceof ImageUploadError) {
        return response.status(502).json({
          message: error.message,
        });
      }

      const databaseError = this.getDatabaseError(error);
      const rootCause = databaseError.cause;

      if (
        (databaseError.code === "23505" && databaseError.constraint === "clubs_name_idx") ||
        (rootCause?.code === "23505" && rootCause.constraint === "clubs_name_idx")
      ) {
        return response.status(409).json({
          message: "A club with this name already exists.",
        });
      }

      return response.status(500).json({
        message: "Failed to create club.",
      });
    }
  };

  getAllClubs = async (_request: Request, response: Response): Promise<Response> => {
    try {
      const clubs = await this.clubService.getAllClubs();

      return response.status(200).json(clubs);
    } catch {
      return response.status(500).json({
        message: "Failed to list clubs.",
      });
    }
  };

  getClubsByLocation = async (request: Request, response: Response): Promise<Response> => {
    try {
      const { country, state } = request.params as { country: string; state: string };

      const clubs = await this.clubService.getClubsByLocation(country, state);

      return response.status(200).json(clubs);
    } catch {
      return response.status(500).json({
        message: "Failed to list clubs by location.",
      });
    }
  };
}
