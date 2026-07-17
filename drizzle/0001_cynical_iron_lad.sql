CREATE TYPE "public"."vehicle_fuel_type" AS ENUM('petrol', 'diesel', 'hybrid', 'plug_in_hybrid', 'electric', 'lpg', 'hydrogen', 'other', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."vehicle_transmission_type" AS ENUM('manual', 'automatic', 'semi_automatic', 'cvt', 'single_speed', 'other', 'unknown');--> statement-breakpoint
CREATE TABLE "search_page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"slug" text NOT NULL,
	"path" text NOT NULL,
	"query" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"response_type" text NOT NULL,
	"source" text NOT NULL,
	"data_provider" text NOT NULL,
	"live_data" boolean DEFAULT false NOT NULL,
	"result_count" integer DEFAULT 0 NOT NULL,
	"response_data" jsonb NOT NULL,
	"generated_by_user_id" text,
	"is_indexable" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_viewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_vehicle_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"nickname" text,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"generation" text,
	"year" integer NOT NULL,
	"engine" text NOT NULL,
	"engine_code" text,
	"fuel_type" "vehicle_fuel_type" DEFAULT 'unknown' NOT NULL,
	"transmission" "vehicle_transmission_type" DEFAULT 'unknown' NOT NULL,
	"variant" text,
	"body_style" text,
	"registration" text,
	"vin" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"tyre_size_front" text,
	"tyre_size_rear" text,
	"oil_grade" text,
	"battery_specification" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "search_page" ADD CONSTRAINT "search_page_generated_by_user_id_user_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_vehicle_profile" ADD CONSTRAINT "user_vehicle_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "search_page_category_slug_unique" ON "search_page" USING btree ("category","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "search_page_path_unique" ON "search_page" USING btree ("path");--> statement-breakpoint
CREATE INDEX "search_page_indexable_idx" ON "search_page" USING btree ("is_indexable");--> statement-breakpoint
CREATE INDEX "search_page_updated_at_idx" ON "search_page" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "search_page_generated_by_user_idx" ON "search_page" USING btree ("generated_by_user_id");--> statement-breakpoint
CREATE INDEX "user_vehicle_profile_user_id_idx" ON "user_vehicle_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_vehicle_profile_default_idx" ON "user_vehicle_profile" USING btree ("user_id","is_default");--> statement-breakpoint
CREATE INDEX "user_vehicle_profile_active_idx" ON "user_vehicle_profile" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "user_vehicle_profile_vehicle_idx" ON "user_vehicle_profile" USING btree ("make","model","year");