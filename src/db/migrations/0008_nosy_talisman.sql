DROP INDEX "club_relegations_club_championship_idx";--> statement-breakpoint
CREATE INDEX "club_relegations_club_championship_idx" ON "club_relegations" USING btree ("club_id","championship_id");