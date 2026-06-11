ALTER TABLE "championships" ADD COLUMN "qualify_one" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "championships" ADD COLUMN "qualify_two" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "championships" ADD CONSTRAINT "championships_qualify_one_check" CHECK ("championships"."qualify_one" between 0 and 10);--> statement-breakpoint
ALTER TABLE "championships" ADD CONSTRAINT "championships_qualify_two_check" CHECK ("championships"."qualify_two" between 0 and 10);