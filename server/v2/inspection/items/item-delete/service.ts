import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { inspectionItems } from '~/server/db/schema';

export interface DeleteInspectionItemParams {
  facilityCode: string;
  inspectionItemId: string;
}

export async function deleteInspectionItem({
  facilityCode,
  inspectionItemId,
}: DeleteInspectionItemParams) {
  await db
    .delete(inspectionItems)
    .where(
      and(
        eq(inspectionItems.facilityCode, facilityCode),
        eq(inspectionItems.inspectionItemId, inspectionItemId),
      ),
    );
}
