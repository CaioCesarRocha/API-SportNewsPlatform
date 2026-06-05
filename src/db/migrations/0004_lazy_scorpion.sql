ALTER TABLE "clubs" ADD COLUMN "slug" varchar(120) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_slug_idx" ON "clubs" USING btree ("slug");