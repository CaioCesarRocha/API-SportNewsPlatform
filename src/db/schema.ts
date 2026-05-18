import { relations, sql } from "drizzle-orm";
import {
  check,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const championshipTypeEnum = pgEnum("championship_type", [
  "elimination rounds",
  "league",
  "mixed",
  "groups",
]);

export const championships = pgTable(
  "championships",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    type: championshipTypeEnum("type").notNull(),
    weight: integer("weight").notNull(),
    emblem: text("emblem").notNull(),
    clubsCount: integer("clubs_count").notNull(),
  },
  (table) => [
    uniqueIndex("championships_name_idx").on(sql`lower(${table.name})`),
    check("championships_weight_check", sql`${table.weight} between 1 and 7`),
    check("championships_clubs_count_check", sql`${table.clubsCount} > 0`),
  ],
);

export const clubs = pgTable(
  "clubs",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("public_id", { length: 32 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    country: varchar("country", { length: 80 }).notNull(),
    state: varchar("state", { length: 80 }),
    shield: text("shield").notNull(),
    stadium: varchar("stadium", { length: 120 }).notNull(),
  },
  (table) => [
    uniqueIndex("clubs_public_id_idx").on(table.publicId),
    uniqueIndex("clubs_name_idx").on(sql`lower(${table.name})`),
  ],
);

export const clubChampionships = pgTable(
  "club_championships",
  {
    clubId: integer("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    championshipId: integer("championship_id")
      .notNull()
      .references(() => championships.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.clubId, table.championshipId] })],
);

export const clubTitles = pgTable(
  "club_titles",
  {
    id: serial("id").primaryKey(),
    clubId: integer("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    championshipId: integer("championship_id")
      .notNull()
      .references(() => championships.id, { onDelete: "cascade" }),
    titlesCount: integer("titles_count").notNull().default(1),
  },
  (table) => [
    uniqueIndex("club_titles_club_championship_idx").on(table.clubId, table.championshipId),
    check("club_titles_count_check", sql`${table.titlesCount} > 0`),
  ],
);

export const rounds = pgTable(
  "rounds",
  {
    id: serial("id").primaryKey(),
    championshipId: integer("championship_id")
      .notNull()
      .references(() => championships.id, { onDelete: "cascade" }),
    identifier: varchar("identifier", { length: 80 }).notNull(),
    homeTeamId: integer("home_team_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "restrict" }),
    visitTeamId: integer("visit_team_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "restrict" }),
    homeGoals: integer("home_goals").notNull(),
    visitGoals: integer("visit_goals").notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    phase: varchar("phase", { length: 80 }).notNull(),
  },
  (table) => [
    check("rounds_home_goals_check", sql`${table.homeGoals} >= 0`),
    check("rounds_visit_goals_check", sql`${table.visitGoals} >= 0`),
    check("rounds_teams_check", sql`${table.homeTeamId} <> ${table.visitTeamId}`),
  ],
);

export const championshipsRelations = relations(championships, ({ many }) => ({
  clubLinks: many(clubChampionships),
  titleLinks: many(clubTitles),
  rounds: many(rounds),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  championshipLinks: many(clubChampionships),
  titleLinks: many(clubTitles),
  homeRounds: many(rounds, { relationName: "homeTeam" }),
  visitRounds: many(rounds, { relationName: "visitTeam" }),
}));

export const clubChampionshipsRelations = relations(
  clubChampionships,
  ({ one }) => ({
    club: one(clubs, {
      fields: [clubChampionships.clubId],
      references: [clubs.id],
    }),
    championship: one(championships, {
      fields: [clubChampionships.championshipId],
      references: [championships.id],
    }),
  }),
);

export const clubTitlesRelations = relations(clubTitles, ({ one }) => ({
  club: one(clubs, {
    fields: [clubTitles.clubId],
    references: [clubs.id],
  }),
  championship: one(championships, {
    fields: [clubTitles.championshipId],
    references: [championships.id],
  }),
}));

export const roundsRelations = relations(rounds, ({ one }) => ({
  championship: one(championships, {
    fields: [rounds.championshipId],
    references: [championships.id],
  }),
  homeTeam: one(clubs, {
    fields: [rounds.homeTeamId],
    references: [clubs.id],
    relationName: "homeTeam",
  }),
  visitTeam: one(clubs, {
    fields: [rounds.visitTeamId],
    references: [clubs.id],
    relationName: "visitTeam",
  }),
}));
