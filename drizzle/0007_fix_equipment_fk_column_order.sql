ALTER TABLE "equipment_loans" DROP CONSTRAINT "equipment_loans_equipment_id_fkey";
--> statement-breakpoint
ALTER TABLE "issues" DROP CONSTRAINT "fk_equipment_id";
--> statement-breakpoint
ALTER TABLE "equipment_loans" ADD CONSTRAINT "equipment_loans_equipment_id_fkey" FOREIGN KEY ("equipment_id","facility_code") REFERENCES "public"."equipment_ledger"("equipment_id","facility_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "fk_equipment_id" FOREIGN KEY ("equipment_id","facility_code") REFERENCES "public"."equipment_ledger"("equipment_id","facility_code") ON DELETE no action ON UPDATE no action;