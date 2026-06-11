import { Request, Response } from "express";

import {
  InvalidChampionshipClubsError,
  ChampionshipService,
  CreateChampionshipPayload,
  UpdateChampionshipPayload,
} from "../services/championship.service";
import {
  ImageStorageNotConfiguredError,
  ImageStorageService,
  ImageUploadError,
} from "../services/image-storage.service";
import { createUniqueConstraintErrorResponse } from "../utils/database-error";

export class ChampionshipController {
  constructor(
    private readonly championshipService: ChampionshipService,
    private readonly imageStorageService: ImageStorageService,
  ) {}

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
        relegation: payload.relegation,
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

      const conflictResponse = createUniqueConstraintErrorResponse(error);

      if (conflictResponse) {
        return response.status(conflictResponse.status).json(conflictResponse.body);
      }

      return response.status(500).json({
        message: "Failed to create championship.",
      });
    }
  };

  checkUniqueness = async (request: Request, response: Response): Promise<Response> => {
    try {
      const { name } = request.query as unknown as { name: string };

      const nameTaken = await this.championshipService.isNameTaken(name);

      return response.status(200).json({ nameTaken });
    } catch {
      return response.status(500).json({
        message: "Failed to check championship uniqueness.",
      });
    }
  };

  getAllChampionships = async (request: Request, response: Response): Promise<Response> => {
    const nameChampionship = typeof request.query.name === "string" ? request.query.name : undefined;
    
    try {
      const championships = await this.championshipService.getAllChampionships({
        name: nameChampionship,
      });

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

  finishChampionship = async (request: Request, response: Response): Promise<Response> => {
    try {
      const { championshipId, clubId } = request.body as {
        championshipId: number;
        clubId: string;
      };

      const championship = await this.championshipService.getChampionshipById(championshipId);

      if (!championship) {
        return response.status(404).json({
          message: "Championship not found.",
        });
      }

      await this.championshipService.finishChampionship(championshipId, clubId);

      return response.status(200).json({ message: "Championship finished successfully." });
    } catch(err) {
      console.error("error: ", err);
      return response.status(500).json({
        message: "Failed to finish championship.",
      });
    }
  };

  updateChampionship = async (request: Request, response: Response): Promise<Response> => {
    let uploadedImageId: string | null = null;

    try {
      const championshipId = Number(request.params.id);
      const payload = request.body as Omit<CreateChampionshipPayload, "type" | "emblem" | "clubsCount" | "clubs">;

      let emblemUrl: string;

      if (request.file) {
        const uploadedImage = await this.imageStorageService.uploadImage({
          file: request.file as Express.Multer.File,
          fileNamePrefix: payload.name,
          folder: "/championships/emblems",
          tags: ["championship", "emblem"],
        });

        uploadedImageId = uploadedImage.fileId;
        emblemUrl = uploadedImage.url;
      } else {
        const existingChampionship = await this.championshipService.getChampionshipById(championshipId);

        if (!existingChampionship) {
          return response.status(404).json({
            message: "Championship not found.",
          });
        }

        emblemUrl = existingChampionship.emblem;
      }

      const championship = await this.championshipService.updateChampionship(championshipId, {
        name: payload.name,
        weight: payload.weight,
        emblem: emblemUrl,
        relegation: payload.relegation,
      });

      if (!championship) {
        await this.deleteUploadedImage(uploadedImageId);

        return response.status(404).json({
          message: "Championship not found.",
        });
      }

      return response.status(200).json(championship);
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

      const conflictResponse = createUniqueConstraintErrorResponse(error);

      if (conflictResponse) {
        return response.status(conflictResponse.status).json(conflictResponse.body);
      }

      return response.status(500).json({
        message: "Failed to update championship.",
      });
    }
  };
}
