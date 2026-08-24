-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "facilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_code" varchar(50) NOT NULL,
	"facility_name" varchar(255) NOT NULL,
	"facility_address" text,
	"facility_number" varchar(50),
	"facility_email" varchar(255),
	"facilities_status" varchar(50) DEFAULT 'active',
	"contract_state" varchar(50),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "facilities_facility_code_key" UNIQUE("facility_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"google_id" varchar(100),
	"user_name" varchar(100) NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"facility_code" varchar(50),
	"user_role" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"password" varchar(255) NOT NULL,
	CONSTRAINT "users_user_id_key" UNIQUE("user_id"),
	CONSTRAINT "users_google_id_key" UNIQUE("google_id"),
	CONSTRAINT "users_user_email_key" UNIQUE("user_email")
);
--> statement-breakpoint
CREATE TABLE "inspection_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_code" varchar(50),
	"equipment_type" varchar(100),
	"equipment_model" varchar(100),
	"inspection_item_id" varchar(50) NOT NULL,
	"inspection_item" varchar(255) NOT NULL,
	"inspection_item_description" text,
	"inspection_component_type" varchar(50),
	"inspection_sort_number" integer,
	"inspection_item_category" text NOT NULL,
	"inspection_type" text NOT NULL,
	"min" numeric,
	"max" numeric,
	"suffix" varchar(255),
	"lowerlimit" numeric,
	"upperlimit" numeric,
	CONSTRAINT "inspection_items_inspection_item_id_key" UNIQUE("inspection_item_id")
);
--> statement-breakpoint
CREATE TABLE "inspection_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"result_id" varchar(100) NOT NULL,
	"inspection_item_id" varchar(50),
	"equipment_serial_number" varchar(100),
	"equipment_id" varchar(50),
	"inspection_date" timestamp NOT NULL,
	"user_id" varchar(50),
	"facility_code" varchar(50),
	"result" varchar(50) NOT NULL,
	"result_notes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "inspection_results_result_id_key" UNIQUE("result_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"invite_code" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"facility_code" varchar(50) NOT NULL,
	"user_role" varchar(50) DEFAULT 'general',
	"invited_by_user_id" varchar(50),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "invitations_invite_code_key" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "equipment_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" varchar(50) NOT NULL,
	"equipment_name" varchar(255) NOT NULL,
	"equipment_model" varchar(100),
	"equipment_manufacturer" varchar(100),
	"equipment_serial_number" varchar(100),
	"equipment_type" varchar(100),
	"facility_code" varchar(50),
	"acquisition_date" date,
	"equipment_status" varchar(50) DEFAULT 'active',
	"equipment_notes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"equipment_maintenance_contract" varchar(255),
	"equipment_storage_location" varchar(255),
	"loan_status" varchar(50) DEFAULT 'active',
	CONSTRAINT "equipment_ledger_equipment_id_facility_code_key" UNIQUE("equipment_id","facility_code")
);
--> statement-breakpoint
CREATE TABLE "user_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(50),
	"announcement_id" integer,
	"is_viewed" boolean DEFAULT false,
	"viewed_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"importance_level" varchar(50) DEFAULT 'normal' NOT NULL,
	"is_active" boolean DEFAULT true,
	"starts_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"audience" varchar(50) DEFAULT 'all' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"issue_id" varchar(50) PRIMARY KEY NOT NULL,
	"reported_date" timestamp NOT NULL,
	"reporter" varchar(255) NOT NULL,
	"facility_code" varchar(50) NOT NULL,
	"equipment_id" varchar(50) NOT NULL,
	"location" varchar(255),
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_code" varchar(50) NOT NULL,
	"employee_code" integer NOT NULL,
	"department" varchar(100),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "employees_facility_code_employee_code_key" UNIQUE("facility_code","employee_code"),
	CONSTRAINT "employees_employee_code_check" CHECK (employee_code > 0)
);
--> statement-breakpoint
CREATE TABLE "equipment_loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_code" varchar(50) NOT NULL,
	"equipment_id" varchar(50) NOT NULL,
	"loan_location" varchar(255) NOT NULL,
	"loan_date" timestamp NOT NULL,
	"loaned_by" integer NOT NULL,
	"return_date" timestamp,
	"returned_by" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"return_location" varchar(255) DEFAULT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_facility_code_fkey" FOREIGN KEY ("facility_code") REFERENCES "public"."facilities"("facility_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_facility_code_fkey" FOREIGN KEY ("facility_code") REFERENCES "public"."facilities"("facility_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_facility_code_fkey" FOREIGN KEY ("facility_code") REFERENCES "public"."facilities"("facility_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_inspection_item_id_fkey" FOREIGN KEY ("inspection_item_id") REFERENCES "public"."inspection_items"("inspection_item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_equipment_id_fkey" FOREIGN KEY ("equipment_id","facility_code") REFERENCES "public"."equipment_ledger"("equipment_id","facility_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_ledger" ADD CONSTRAINT "equipment_ledger_facility_code_fkey" FOREIGN KEY ("facility_code") REFERENCES "public"."facilities"("facility_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "fk_facility_code" FOREIGN KEY ("facility_code") REFERENCES "public"."facilities"("facility_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "fk_equipment_id" FOREIGN KEY ("facility_code","equipment_id") REFERENCES "public"."equipment_ledger"("equipment_id","facility_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_facility_code_fkey" FOREIGN KEY ("facility_code") REFERENCES "public"."facilities"("facility_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_loans" ADD CONSTRAINT "equipment_loans_facility_code_fkey" FOREIGN KEY ("facility_code") REFERENCES "public"."facilities"("facility_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_loans" ADD CONSTRAINT "equipment_loans_equipment_id_fkey" FOREIGN KEY ("facility_code","equipment_id") REFERENCES "public"."equipment_ledger"("equipment_id","facility_code") ON DELETE no action ON UPDATE no action;
*/