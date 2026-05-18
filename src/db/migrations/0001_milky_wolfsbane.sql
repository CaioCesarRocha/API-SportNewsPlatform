DROP INDEX "clubs_name_country_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_name_idx" ON "clubs" USING btree (lower("name"));
