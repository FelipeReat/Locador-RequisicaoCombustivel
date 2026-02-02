CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" text NOT NULL,
	"record_id" text NOT NULL,
	"action" text NOT NULL,
	"old_values" text,
	"new_values" text,
	"user_id" integer,
	"timestamp" text DEFAULT 'now()' NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "data_backups" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" text NOT NULL,
	"backup_data" text NOT NULL,
	"backup_date" text DEFAULT 'now()' NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "fuel_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"current_mileage" text NOT NULL,
	"previous_mileage" text NOT NULL,
	"distance_traveled" text NOT NULL,
	"fuel_type" text NOT NULL,
	"liters_refueled" text NOT NULL,
	"price_per_liter" text NOT NULL,
	"total_cost" text NOT NULL,
	"operator_id" integer NOT NULL,
	"fuel_station" text,
	"notes" text,
	"record_date" text NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_vehicle_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"km_initial" text NOT NULL,
	"km_final" text,
	"fuel_level_start" text NOT NULL,
	"fuel_level_end" text,
	"inspection_start" text,
	"inspection_end" text,
	"status" text DEFAULT 'open' NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fuel_requisitions" ADD COLUMN "discount" text;--> statement-breakpoint
ALTER TABLE "fuel_requisitions" ADD COLUMN "purchase_order_generated" text DEFAULT 'false';--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "company_id" integer;