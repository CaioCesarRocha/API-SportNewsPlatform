CREATE TABLE "club_relegations" (
	"id" serial PRIMARY KEY NOT NULL,
	"club_id" varchar(32) NOT NULL,
	"championship_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "club_relegations" ADD CONSTRAINT "club_relegations_club_id_clubs_public_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("public_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_relegations" ADD CONSTRAINT "club_relegations_championship_id_championships_id_fk" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "club_relegations_club_championship_idx" ON "club_relegations" USING btree ("club_id","championship_id");