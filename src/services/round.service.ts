import { and, asc, eq, ilike, inArray, InferInsertModel, InferSelectModel } from "drizzle-orm";

import { db } from "../db";
import { championships, clubChampionships, clubs, rounds } from "../db/schema";

export type UpdateRoundPayload = {
  identifier?: string;
  homeTeamId?: string;
  visitTeamId?: string;
  homeGoals?: number;
  visitGoals?: number;
  date?: Date;
  phase?: string;
};

export type CreateRoundPayload = Pick<
  InferInsertModel<typeof rounds>,
  "championshipId" | "identifier" | "homeGoals" | "visitGoals" | "date" | "phase"
> & {
  homeTeamId: string;
  visitTeamId: string;
};

export type ListRoundsByFilterParams = {
  championshipId: number;
  identifier?: string;
  phase?: string;
};

export type Round = InferSelectModel<typeof rounds>;

export type RoundClub = {
  id: string;
  name: string;
  slug: string;
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
      slug: club.slug,
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
          identifier: payload.identifier.toLowerCase(),
          homeTeamId: homeTeam.id,
          visitTeamId: visitTeam.id,
          homeGoals: payload.homeGoals,
          visitGoals: payload.visitGoals,
          date: payload.date,
          phase: payload.phase.toLowerCase(),
        })
        .returning();

      return this.serializeRound(createdRound, homeTeam, visitTeam);
    });
  }

  async listRoundsByFilter(params: ListRoundsByFilterParams): Promise<RoundResponse[]> {
    const conditions = [
      eq(rounds.championshipId, params.championshipId),
    ];

    if (params.identifier) {
      conditions.push(ilike(rounds.identifier, params.identifier));
    }

    if (params.phase) {
      conditions.push(ilike(rounds.phase, params.phase));
    }

    const whereClause = and(...conditions);

    const result = await db.query.rounds.findMany({
      where: whereClause,
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

  async updateRound(id: number, payload: UpdateRoundPayload): Promise<RoundResponse> {
    return db.transaction(async (tx) => {
      const existingRound = await tx.query.rounds.findFirst({
        where: eq(rounds.id, id),
        with: {
          homeTeam: true,
          visitTeam: true,
        },
      });

      if (!existingRound) {
        throw new InvalidRoundReferenceError("Round not found.");
      }

      if (
        payload.homeTeamId &&
        payload.visitTeamId &&
        payload.homeTeamId === payload.visitTeamId
      ) {
        throw new InvalidRoundReferenceError("homeTeamId and visitTeamId must be different.");
      }

      let newHomeTeamId: number | undefined;
      let newVisitTeamId: number | undefined;

      const teamPublicIds = [payload.homeTeamId, payload.visitTeamId].filter(Boolean) as string[];

      if (teamPublicIds.length > 0) {
        const selectedClubs = await tx.query.clubs.findMany({
          where: inArray(clubs.publicId, teamPublicIds),
        });

        if (selectedClubs.length !== teamPublicIds.length) {
          throw new InvalidRoundReferenceError("One or more clubs do not exist.");
        }

        const clubIds = selectedClubs.map((club) => club.id);
        const championshipClubLinks = await tx.query.clubChampionships.findMany({
          where: and(
            eq(clubChampionships.championshipId, existingRound.championshipId),
            inArray(clubChampionships.clubId, clubIds),
          ),
        });

        if (championshipClubLinks.length !== clubIds.length) {
          throw new InvalidRoundReferenceError(
            "Both clubs must belong to the informed championship.",
          );
        }

        if (payload.homeTeamId) {
          const club = selectedClubs.find((c) => c.publicId === payload.homeTeamId);
          if (club) newHomeTeamId = club.id;
        }

        if (payload.visitTeamId) {
          const club = selectedClubs.find((c) => c.publicId === payload.visitTeamId);
          if (club) newVisitTeamId = club.id;
        }
      }

      const resolvedHomeTeamId = newHomeTeamId ?? existingRound.homeTeamId;
      const resolvedVisitTeamId = newVisitTeamId ?? existingRound.visitTeamId;

      if (resolvedHomeTeamId === resolvedVisitTeamId) {
        throw new InvalidRoundReferenceError("homeTeamId and visitTeamId must be different.");
      }

      const updateData: Partial<InferInsertModel<typeof rounds>> & { homeTeamId?: number; visitTeamId?: number } = {};

      if (payload.identifier !== undefined) {
        updateData.identifier = payload.identifier.toLowerCase();
      }
      if (payload.homeGoals !== undefined) {
        updateData.homeGoals = payload.homeGoals;
      }
      if (payload.visitGoals !== undefined) {
        updateData.visitGoals = payload.visitGoals;
      }
      if (payload.date !== undefined) {
        updateData.date = payload.date;
      }
      if (payload.phase !== undefined) {
        updateData.phase = payload.phase.toLowerCase();
      }
      if (newHomeTeamId !== undefined) {
        updateData.homeTeamId = newHomeTeamId;
      }
      if (newVisitTeamId !== undefined) {
        updateData.visitTeamId = newVisitTeamId;
      }

      await tx.update(rounds).set(updateData).where(eq(rounds.id, id));

      const updatedRound = await tx.query.rounds.findFirst({
        where: eq(rounds.id, id),
        with: {
          homeTeam: true,
          visitTeam: true,
        },
      });

      if (!updatedRound) {
        throw new InvalidRoundReferenceError("Round not found after update.");
      }

      return this.serializeRound(updatedRound, updatedRound.homeTeam, updatedRound.visitTeam);
    });
  }
}
