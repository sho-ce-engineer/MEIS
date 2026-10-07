ALTER TABLE "inspection_results" DROP CONSTRAINT "inspection_results_inspection_item_id_fkey";
--> statement-breakpoint
ALTER TABLE "inspection_results" DROP CONSTRAINT "inspection_results_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_inspection_item_id_facility_code_fkey" FOREIGN KEY ("inspection_item_id","facility_code") REFERENCES "public"."inspection_items"("inspection_item_id","facility_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_results" ADD CONSTRAINT "inspection_results_user_id_facility_code_fkey" FOREIGN KEY ("user_id","facility_code") REFERENCES "public"."users"("user_id","facility_code") ON DELETE no action ON UPDATE no action;