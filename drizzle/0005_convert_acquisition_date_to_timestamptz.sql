ALTER TABLE "equipment_ledger" ALTER COLUMN "acquisition_date" SET DATA TYPE timestamp with time zone USING "acquisition_date"::timestamp AT TIME ZONE 'Asia/Tokyo';
