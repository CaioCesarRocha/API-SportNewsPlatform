import { and, asc, eq, ilike, inArray, InferInsertModel, InferSelectModel } from "drizzle-orm";

import { db } from "../db";
import { championships, clubChampionships, clubs, rounds } from "../db/schema";

export type CreateRoundPayload = Pick<
  InferInsertModel<typeof rounds>,
  "championshipId" | "identifier" | "homeGoals" | "visitGoals" | "date" | "phase"
> & {
  homeTeamId: string;
  visitTeamId: string;
};

export type ListRoundsByFilterParams = {
  championshipId: number;
  identifier: string;
};

export type Round = InferSelectModel<typeof rounds>;

export type RoundClub = {
  id: string;
  name: string;
  country: string;
  state: string | null;
  shield: string;
  stadium: string;
};

export type RoundResponse = Omit<Round, "homeTeamId" | "visitTeamId"> & {
  homeTeam: RoundClub;
  visitTeam: RoundClub;
};

export class InvalidRoundReferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRoundReferenceError";
  }
}

export class RoundService {
  private serializeClub(club: InferSelectModel<typeof clubs>): RoundClub {
    return {
      id: club.publicId,
      name: club.name,
      country: club.country,
      state: club.state ?? null,
      shield: club.shield,
      stadium: club.stadium,
    };
  }

  private serializeRound(
    round: InferSelectModel<typeof rounds>,
    homeTeam: InferSelectModel<typeof clubs>,
    visitTeam: InferSelectModel<typeof clubs>,
  ): RoundResponse {
    const { homeTeamId: _homeTeamId, visitTeamId: _visitTeamId, ...roundData } = round;

    return {
      ...roundData,
      homeTeam: this.serializeClub(homeTeam),
      visitTeam: this.serializeClub(visitTeam),
    };
  }

  async createRound(payload: CreateRoundPayload): Promise<RoundResponse> {
    return db.transaction(async (tx) => {
      const championship = await tx.query.championships.findFirst({
        where: eq(championships.id, payload.championshipId),
      });

      if (!championship) {
        throw new InvalidRoundReferenceError("Championship not found.");
      }

      if (payload.homeTeamId === payload.visitTeamId) {
        throw new InvalidRoundReferenceError("homeTeamId and visitTeamId must be different.");
      }

      const selectedClubs = await tx.query.clubs.findMany({
        where: inArray(clubs.publicId, [payload.homeTeamId, payload.visitTeamId]),
      });

      if (selectedClubs.length !== 2) {
        throw new InvalidRoundReferenceError("One or more clubs do not exist.");
      }

      const clubIds = selectedClubs.map((club) => club.id);
      const championshipClubLinks = await tx.query.clubChampionships.findMany({
        where: and(
          eq(clubChampionships.championshipId, payload.championshipId),
          inArray(clubChampionships.clubId, clubIds),
        ),
      });

      if (championshipClubLinks.length !== 2) {
        throw new InvalidRoundReferenceError("Both clubs must belong to the informed championship.");
      }

      const homeTeam = selectedClubs.find((club) => club.publicId === payload.homeTeamId);
      const visitTeam = selectedClubs.find((club) => club.publicId === payload.visitTeamId);

      if (!homeTeam || !visitTeam) {
        throw new InvalidRoundReferenceError("One or more clubs do not exist.");
      }

      const [createdRound] = await tx
        .insert(rounds)
        .values({
          championshipId: payload.championshipId,
          identifier: payload.identifier,
          homeTeamId: homeTeam.id,
          visitTeamId: visitTeam.id,
          homeGoals: payload.homeGoals,
          visitGoals: payload.visitGoals,
          date: payload.date,
          phase: payload.phase,
        })
        .returning();

      return this.serializeRound(createdRound, homeTeam, visitTeam);
    });
  }

  async listRoundsByFilter(params: ListRoundsByFilterParams): Promise<RoundResponse[]> {
    const result = await db.query.rounds.findMany({
      where: and(
        eq(rounds.championshipId, params.championshipId),
        ilike(rounds.identifier, params.identifier),
      ),
      with: {
        homeTeam: true,
        visitTeam: true,
      },
      orderBy: [asc(rounds.date), asc(rounds.id)],
    });

    return result.map(({ homeTeam, visitTeam, ...round }) =>
      this.serializeRound(round, homeTeam, visitTeam),
    );
  }
}
