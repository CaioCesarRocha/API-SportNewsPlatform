import { Request, Response } from "express";

import {
  CreateRoundPayload,
  InvalidRoundReferenceError,
  RoundService,
  UpdateRoundPayload,
} from "../services/round.service";

type DatabaseError = {
  code?: string;
  constraint?: string;
  cause?: DatabaseError;
};

export class RoundController {
  constructor(private readonly roundService: RoundService) {}

  private getDatabaseError(error: unknown): DatabaseError {
    return error as DatabaseError;
  }

  createRound = async (request: Request, response: Response): Promise<Response> => {
    try {
      const payload = request.body as CreateRoundPayload;

      const round = await this.roundService.createRound({
        championshipId: payload.championshipId,
        identifier: payload.identifier,
        homeTeamId: payload.homeTeamId,
        visitTeamId: payload.visitTeamId,
        homeGoals: payload.homeGoals,
        visitGoals: payload.visitGoals,
        date: new Date(payload.date),
        phase: payload.phase,
      });

      return response.status(201).json(round);
    } catch (error) {
      if (error instanceof InvalidRoundReferenceError) {
        return response.status(400).json({
          message: error.message,
        });
      }

      const databaseError = this.getDatabaseError(error);

      if (
        databaseError.code === "23514" ||
        databaseError.cause?.code === "23514" ||
        databaseError.code === "23503" ||
        databaseError.cause?.code === "23503"
      ) {
        return response.status(400).json({
          message: "Invalid round data.",
        });
      }

      return response.status(500).json({
        message: "Failed to create round.",
      });
    }
  };

  updateRound = async (request: Request, response: Response): Promise<Response> => {
    try {
      const { id } = request.params as { id: string };
      const payload = request.body as UpdateRoundPayload;

      const round = await this.roundService.updateRound(Number(id), {
        ...payload,
        date: payload.date ? new Date(payload.date) : undefined,
      });

      return response.status(200).json(round);
    } catch (error) {
      if (error instanceof InvalidRoundReferenceError) {
        return response.status(400).json({
          message: error.message,
        });
      }

      const databaseError = this.getDatabaseError(error);

      if (
        databaseError.code === "23514" ||
        databaseError.cause?.code === "23514" ||
        databaseError.code === "23503" ||
        databaseError.cause?.code === "23503"
      ) {
        return response.status(400).json({
          message: "Invalid round data.",
        });
      }

      return response.status(500).json({
        message: "Failed to update round.",
      });
    }
  };

  listRoundsByFilter = async (request: Request, response: Response): Promise<Response> => {
    try {
      const { championshipId } = request.params as {
        championshipId: string;
      };
      const { identifier } = request.query as {
        identifier?: string;
      };

      const rounds = await this.roundService.listRoundsByFilter({
        championshipId: Number(championshipId),
        identifier,
      });

      return response.status(200).json(rounds);
    } catch {
      return response.status(500).json({
        message: "Failed to list rounds.",
      });
    }
  };
}
