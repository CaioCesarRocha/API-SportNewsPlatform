import { Request, Response } from "express";

import { ClubService, CreateClubPayload } from "../services/club.service";
import {
  ImageStorageNotConfiguredError,
  ImageStorageService,
  ImageUploadError,
} from "../services/image-storage.service";
import { createUniqueConstraintErrorResponse } from "../utils/database-error";

export class ClubController {
  constructor(
    private readonly clubService: ClubService,
    private readonly imageStorageService: ImageStorageService,
  ) {}

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
        slug: payload.slug,
        country: payload.country,
        state: payload.state,
        shield: uploadedImage.url,
        stadium: payload.stadium,
      });

      return response.status(201).json(club);
    } catch (error) {
      console.error("error create club: ", error);
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
        message: "Failed to create club.",
      });
    }
  };

  checkUniqueness = async (request: Request, response: Response): Promise<Response> => {
    try {
      const { name, slug } = request.query as unknown as {
        name?: string;
        slug?: string;
      };

      const [nameTaken, slugTaken] = await Promise.all([
        name ? this.clubService.checkNameTaken(name) : Promise.resolve(false),
        slug ? this.clubService.checkSlugTaken(slug) : Promise.resolve(false),
      ]);

      return response.status(200).json({ nameTaken, slugTaken });
    } catch {
      return response.status(500).json({
        message: "Failed to check club uniqueness.",
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

  updateClub = async (request: Request, response: Response): Promise<Response> => {
    let uploadedImageId: string | null = null;

    try {
      const { id } = request.params as { id: string };
      const payload = request.body as Omit<CreateClubPayload, "shield">;

      let shieldUrl: string;

      if (request.file) {
        const uploadedImage = await this.imageStorageService.uploadImage({
          file: request.file as Express.Multer.File,
          fileNamePrefix: payload.name,
          folder: "/clubs/shields",
          tags: ["club", "shield"],
        });

        uploadedImageId = uploadedImage.fileId;
        shieldUrl = uploadedImage.url;
      } else {
        const existingClub = await this.clubService.getClubByPublicId(id);

        if (!existingClub) {
          return response.status(404).json({
            message: "Club not found.",
          });
        }

        shieldUrl = existingClub.shield;
      }

      const club = await this.clubService.updateClub(id, {
        name: payload.name,
        slug: payload.slug,
        country: payload.country,
        state: payload.state,
        shield: shieldUrl,
        stadium: payload.stadium,
      });

      if (!club) {
        await this.deleteUploadedImage(uploadedImageId);

        return response.status(404).json({
          message: "Club not found.",
        });
      }

      return response.status(200).json(club);
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
        message: "Failed to update club.",
      });
    }
  };
}
