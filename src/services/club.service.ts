import { randomBytes } from "node:crypto";
import { and, asc, eq, ilike, InferInsertModel, InferSelectModel, ne } from "drizzle-orm";

import { db } from "../db/index";
import { clubs } from "../db/schema";

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
