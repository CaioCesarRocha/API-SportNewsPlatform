CREATE TYPE "public"."championship_type" AS ENUM('elimination rounds', 'league', 'mixed', 'groups');--> statement-breakpoint
CREATE TABLE "championships" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"type" "championship_type" NOT NULL,
	"weight" integer NOT NULL,
	"emblem" text NOT NULL,
	"clubs_count" integer NOT NULL,
	CONSTRAINT "championships_weight_check" CHECK ("championships"."weight" between 1 and 7),
	CONSTRAINT "championships_clubs_count_check" CHECK ("championships"."clubs_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "club_championships" (
	"club_id" integer NOT NULL,
	"championship_id" integer NOT NULL,
	CONSTRAINT "club_championships_club_id_championship_id_pk" PRIMARY KEY("club_id","championship_id")
);
--> statement-breakpoint
CREATE TABLE "club_titles" (
	"id" serial PRIMARY KEY NOT NULL,
	"club_id" integer NOT NULL,
	"championship_id" integer NOT NULL,
	"titles_count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "club_titles_count_check" CHECK ("club_titles"."titles_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"country" varchar(80) NOT NULL,
	"state" varchar(80),
	"shield" text NOT NULL,
	"stadium" varchar(120) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"championship_id" integer NOT NULL,
	"identifier" varchar(80) NOT NULL,
	"home_team_id" integer NOT NULL,
	"visit_team_id" integer NOT NULL,
	"home_goals" integer NOT NULL,
	"visit_goals" integer NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"phase" varchar(80) NOT NULL,
	CONSTRAINT "rounds_home_goals_check" CHECK ("rounds"."home_goals" >= 0),
	CONSTRAINT "rounds_visit_goals_check" CHECK ("rounds"."visit_goals" >= 0),
	CONSTRAINT "rounds_teams_check" CHECK ("rounds"."home_team_id" <> "rounds"."visit_team_id")
);
--> statement-breakpoint
ALTER TABLE "club_championships" ADD CONSTRAINT "club_championships_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_championships" ADD CONSTRAINT "club_championships_championship_id_championships_id_fk" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_titles" ADD CONSTRAINT "club_titles_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_titles" ADD CONSTRAINT "club_titles_championship_id_championships_id_fk" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_championship_id_championships_id_fk" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_home_team_id_clubs_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_visit_team_id_clubs_id_fk" FOREIGN KEY ("visit_team_id") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "championships_name_idx" ON "championships" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "club_titles_club_championship_idx" ON "club_titles" USING btree ("club_id","championship_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_name_country_idx" ON "clubs" USING btree ("name","country");
