import { Request, Response } from "express";

import {
  InvalidChampionshipClubsError,
  ChampionshipService,
  CreateChampionshipPayload,
} from "../services/championship.service";
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

export class ChampionshipController {
  constructor(
    private readonly championshipService: ChampionshipService,
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

  createChampionship = async (request: Request, response: Response): Promise<Response> => {
    let uploadedImageId: string | null = null;

    try {
      const payload = request.body as Omit<CreateChampionshipPayload, "emblem">;
      const uploadedImage = await this.imageStorageService.uploadImage({
        file: request.file as Express.Multer.File,
        fileNamePrefix: payload.name,
        folder: "/championships/emblems",
        tags: ["championship", "emblem"],
      });

      uploadedImageId = uploadedImage.fileId;

      const championship = await this.championshipService.createChampionship({
        name: payload.name,
        type: payload.type,
        weight: payload.weight,
        emblem: uploadedImage.url,
        clubsCount: payload.clubsCount,
        clubs: payload.clubs,
      });

      return response.status(201).json(championship);
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

      if (error instanceof InvalidChampionshipClubsError) {
        return response.status(400).json({
          message: error.message,
        });
      }

      const databaseError = this.getDatabaseError(error);
      const rootCause = databaseError.cause;

      if (
        (databaseError.code === "23505" &&
          databaseError.constraint === "championships_name_idx") ||
        (rootCause?.code === "23505" && rootCause.constraint === "championships_name_idx")
      ) {
        return response.status(409).json({
          message: "A championship with this name already exists.",
        });
      }

      return response.status(500).json({
        message: "Failed to create championship.",
      });
    }
  };

  getAllChampionships = async (_request: Request, response: Response): Promise<Response> => {
    try {
      const championships = await this.championshipService.getAllChampionships();

      return response.status(200).json(championships);
    } catch {
      return response.status(500).json({
        message: "Failed to list championships.",
      });
    }
  };

  getChampionshipById = async (request: Request, response: Response): Promise<Response> => {
    try {
      const championshipId = Number(request.params.id);

      const championship = await this.championshipService.getChampionshipById(championshipId);

      if (!championship) {
        return response.status(404).json({
          message: "Championship not found.",
        });
      }

      return response.status(200).json(championship);
    } catch {
      return response.status(500).json({
        message: "Failed to get championship.",
      });
    }
  };
}
