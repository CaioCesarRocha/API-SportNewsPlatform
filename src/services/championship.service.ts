import { asc, eq, inArray, InferInsertModel, InferSelectModel } from "drizzle-orm";

import { db } from "../db/index";
import { championships, clubChampionships, clubs } from "../db/schema";

export type ChampionshipType = "elimination rounds" | "league" | "mixed" | "groups";

export type CreateChampionshipPayload = Pick<
  InferInsertModel<typeof championships>,
  "name" | "type" | "weight" | "emblem" | "clubsCount"
> & {
  clubs: string[];
};

export type Championship = InferSelectModel<typeof championships>;
export type ChampionshipClub = Omit<InferSelectModel<typeof clubs>, "id" | "publicId"> & {
  id: string;
};
export type ChampionshipWithClubs = Championship & {
  clubs: ChampionshipClub[];
};

export class InvalidChampionshipClubsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidChampionshipClubsError";
  }
}

export class ChampionshipService {
  private serializeClub(club: InferSelectModel<typeof clubs>): ChampionshipClub {
    const { id: _internalId, publicId, ...clubData } = club;

    return {
      id: publicId,
      ...clubData,
    };
  }

  async createChampionship(payload: CreateChampionshipPayload): Promise<Championship> {
    return db.transaction(async (tx) => {
      const selectedClubs = await tx
        .select({
          id: clubs.id,
          publicId: clubs.publicId,
        })
        .from(clubs)
        .where(inArray(clubs.publicId, payload.clubs));

      if (selectedClubs.length !== payload.clubs.length) {
        throw new InvalidChampionshipClubsError("One or more clubs do not exist.");
      }

      const [createdChampionship] = await tx
        .insert(championships)
        .values({
          name: payload.name,
          type: payload.type,
          weight: payload.weight,
          emblem: payload.emblem,
          clubsCount: payload.clubsCount,
        })
        .returning();

      await tx.insert(clubChampionships).values(
        selectedClubs.map((club) => ({
          clubId: club.id,
          championshipId: createdChampionship.id,
        })),
      );

      return createdChampionship;
    });
  }

  async getAllChampionships(): Promise<Championship[]> {
    return db.query.championships.findMany({
      orderBy: [asc(championships.name)],
    });
  }

  async getChampionshipById(id: number): Promise<ChampionshipWithClubs | null> {
    const championship = await db.query.championships.findFirst({
      where: eq(championships.id, id),
      with: {
        clubLinks: {
          with: {
            club: true,
          },
        },
      },
    });

    if (!championship) {
      return null;
    }

    const { clubLinks, ...championshipData } = championship;

    return {
      ...championshipData,
      clubs: clubLinks.map((clubLink) => this.serializeClub(clubLink.club)),
    };
  }
}
