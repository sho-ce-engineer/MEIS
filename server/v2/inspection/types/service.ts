import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { inspectionItems } from '~/server/db/schema';

export interface ListInspectionTypesParams {
  facilityCode: string;
  equipmentModel: string;
}

export async function listInspectionTypes({
  facilityCode,
  equipmentModel,
}: ListInspectionTypesParams) {
  const rows = await db
    .selectDistinct({ inspectionType: inspectionItems.inspectionType })
    .from(inspectionItems)
    .where(
      and(
        eq(inspectionItems.equipmentModel, equipmentModel),
        eq(inspectionItems.facilityCode, facilityCode),
      ),
    );

  return rows;
}
