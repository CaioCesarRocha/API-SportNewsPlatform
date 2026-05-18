ALTER TABLE "clubs" ADD COLUMN "public_id" varchar(32);--> statement-breakpoint
UPDATE "clubs"
SET "public_id" = md5(random()::text || clock_timestamp()::text || "id"::text)
WHERE "public_id" IS NULL;--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_public_id_idx" ON "clubs" USING btree ("public_id");
