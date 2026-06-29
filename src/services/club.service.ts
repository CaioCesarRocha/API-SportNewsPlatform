import { randomBytes } from "node:crypto";
import { and, asc, eq, ilike, InferInsertModel, InferSelectModel } from "drizzle-orm";

import { db } from "../db/index";
import { clubs, rounds } from "../db/schema";

export type CreateClubPayload = Pick<
  InferInsertModel<typeof clubs>,
  "name" | "slug" | "country" | "state" | "shield" | "stadium"
>;

export type Club = InferSelectModel<typeof clubs>;

export type ClubResponse = Omit<Club, "id" | "publicId"> & {
  id: string;
};

export type ClubTitle = {
  championship: {
    id: number;
    name: string;
    type: "elimination rounds" | "league" | "mixed" | "groups";
    weight: number;
    emblem: string;
    clubsCount: number;
  };
};

export type ClubWithTitles = ClubResponse & {
  titles: ClubTitle[];
};

export type ClubPerformance = {
  club: ClubResponse;
  games: number;
  victories: number;
  draws: number;
  defeats: number;
  pontuation: number;
  performance: number;
};

export class ClubService {
  private generatePublicId(): string {
    return randomBytes(16).toString("hex");
  }

  private serializeClub(club: Club): ClubResponse {
    const { id: _internalId, publicId, ...clubData } = club;

    return {
      id: publicId,
      ...clubData,
    };
  }

  private serializeClubWithTitles(
    club: Club,
    titleLinks: {
      championship: ClubTitle["championship"];
    }[],
  ): ClubWithTitles {
    return {
      ...this.serializeClub(club),
      titles: titleLinks.map((titleLink) => ({
        championship: titleLink.championship,
      })),
    };
  }

  async createClub(payload: CreateClubPayload): Promise<ClubResponse> {
    const [createdClub] = await db
      .insert(clubs)
      .values({
        publicId: this.generatePublicId(),
        name: payload.name,
        slug: payload.slug,
        country: payload.country,
        state: payload.state?.trim() ? payload.state.trim() : null,
        shield: payload.shield,
        stadium: payload.stadium,
      })
      .returning();

    return this.serializeClub(createdClub);
  }

  async getAllClubs(): Promise<ClubWithTitles[]> {
    const result = await db.query.clubs.findMany({
      with: {
        titleLinks: {
          with: {
            championship: true,
          },
        },
      },
      orderBy: [asc(clubs.name)],
    });

    return result.map(({ titleLinks, ...club }) => this.serializeClubWithTitles(club, titleLinks));
  }

  async getClubsByLocation(country: string, state: string): Promise<ClubResponse[]> {
    const result = await db.query.clubs.findMany({
      where: and(ilike(clubs.country, country), ilike(clubs.state, state)),
      orderBy: [asc(clubs.name)],
    });

    return result.map((club) => this.serializeClub(club));
  }

  async getClubByPublicId(publicId: string): Promise<ClubResponse | null> {
    const club = await db.query.clubs.findFirst({
      where: eq(clubs.publicId, publicId),
    });

    if (!club) {
      return null;
    }

    return this.serializeClub(club);
  }

  async checkNameTaken(name: string): Promise<boolean> {
    const [club] = await db
      .select({ id: clubs.id })
      .from(clubs)
      .where(ilike(clubs.name, name))
      .limit(1);

    return !!club;
  }

  async checkSlugTaken(slug: string): Promise<boolean> {
    const [club] = await db
      .select({ id: clubs.id })
      .from(clubs)
      .where(eq(clubs.slug, slug))
      .limit(1);

    return !!club;
  }

  async getClubPerformance(
    sortBy?: "victory" | "pontuation" | "performance",
  ): Promise<ClubPerformance[]> {
    const allClubs = await db.select().from(clubs);
    const allRounds = await db.select().from(rounds);

    const clubMap = new Map<number, Club>();
    for (const club of allClubs) {
      clubMap.set(club.id, club);
    }

    const statsMap = new Map<
      number,
      { victories: number; draws: number; defeats: number }
    >();

    for (const club of allClubs) {
      statsMap.set(club.id, { victories: 0, draws: 0, defeats: 0 });
    }

    for (const round of allRounds) {
      const home = statsMap.get(round.homeTeamId);
      const visit = statsMap.get(round.visitTeamId);

      if (home && visit) {
        if (round.homeGoals > round.visitGoals) {
          home.victories += 1;
          visit.defeats += 1;
        } else if (round.homeGoals < round.visitGoals) {
          visit.victories += 1;
          home.defeats += 1;
        } else {
          home.draws += 1;
          visit.draws += 1;
        }
      }
    }

    const result: ClubPerformance[] = [];

    for (const [clubId, stats] of statsMap) {
      const club = clubMap.get(clubId);
      if (!club) continue;

      const totalGames = stats.victories + stats.draws + stats.defeats;
      const pontuation = stats.victories * 3 + stats.draws;
      const performance = totalGames > 0 ? pontuation / (totalGames * 3) : 0;

      result.push({
        club: this.serializeClub(club),
        games: totalGames,
        victories: stats.victories,
        draws: stats.draws,
        defeats: stats.defeats,
        pontuation,
        performance: Math.round(performance * 10000) / 10000,
      });
    }

    if (sortBy === "victory") {
      result.sort((a, b) => b.victories - a.victories);
    } else if (sortBy === "pontuation") {
      result.sort((a, b) => b.pontuation - a.pontuation);
    } else if (sortBy === "performance") {
      result.sort((a, b) => b.performance - a.performance);
    }

    return result;
  }

  async updateClub(publicId: string, payload: CreateClubPayload): Promise<ClubResponse | null> {
    const [updatedClub] = await db
      .update(clubs)
      .set({
        name: payload.name,
        slug: payload.slug,
        country: payload.country,
        state: payload.state?.trim() ? payload.state.trim() : null,
        shield: payload.shield,
        stadium: payload.stadium,
      })
      .where(eq(clubs.publicId, publicId))
      .returning();

    if (!updatedClub) {
      return null;
    }

    return this.serializeClub(updatedClub);
  }
}
