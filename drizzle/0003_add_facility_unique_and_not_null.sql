ALTER TABLE "equipment_ledger" ALTER COLUMN "facility_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inspection_items" ALTER COLUMN "facility_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inspection_results" ALTER COLUMN "inspection_item_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inspection_results" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inspection_results" ALTER COLUMN "facility_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "facility_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_inspection_item_id_facility_code_key" UNIQUE("inspection_item_id","facility_code");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_user_id_facility_code_key" UNIQUE("user_id","facility_code");