ALTER TABLE "club_titles" DROP CONSTRAINT "club_titles_count_check";--> statement-breakpoint
ALTER TABLE "club_titles" DROP CONSTRAINT "club_titles_club_id_clubs_id_fk";
--> statement-breakpoint
ALTER TABLE "club_titles" ALTER COLUMN "club_id" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "club_titles" ADD CONSTRAINT "club_titles_club_id_clubs_public_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("public_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_titles" DROP COLUMN "titles_count";