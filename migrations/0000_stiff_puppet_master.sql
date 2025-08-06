CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cnpj" text NOT NULL,
	"full_name" text NOT NULL,
	"contact" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"active" text DEFAULT 'true' NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL,
	CONSTRAINT "companies_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "fuel_requisitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"client" text NOT NULL,
	"vehicle_id" integer NOT NULL,
	"km_atual" text NOT NULL,
	"km_anterior" text NOT NULL,
	"km_rodado" text NOT NULL,
	"tanque_cheio" text DEFAULT 'false' NOT NULL,
	"fuel_type" text NOT NULL,
	"quantity" text,
	"price_per_liter" text,
	"fiscal_coupon" text,
	"justification" text,
	"required_date" text,
	"priority" text DEFAULT 'media' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approver_id" integer,
	"approved_date" text,
	"rejection_reason" text,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"fantasia" text NOT NULL,
	"cnpj" text NOT NULL,
	"responsavel" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"active" text DEFAULT 'true' NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL,
	CONSTRAINT "suppliers_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"full_name" text,
	"department_id" integer,
	"phone" text,
	"position" text,
	"role" text DEFAULT 'employee' NOT NULL,
	"active" text DEFAULT 'true' NOT NULL,
	"hire_date" text,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"plate" text NOT NULL,
	"model" text NOT NULL,
	"brand" text NOT NULL,
	"year" integer NOT NULL,
	"fuel_type" text NOT NULL,
	"mileage" text DEFAULT '0',
	"status" text DEFAULT 'active' NOT NULL,
	"last_maintenance" text,
	"next_maintenance" text,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL,
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate")
);
