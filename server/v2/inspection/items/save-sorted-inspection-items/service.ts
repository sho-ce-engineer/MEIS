import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { inspectionItems } from '~/server/db/schema';

export interface SaveSortedInspectionItemsParams {
  facilityCode: string;
  updatedItems: Record<string, { inspection_item_id: string }[]>;
}

export async function saveSortedInspectionItems({
  facilityCode,
  updatedItems,
}: SaveSortedInspectionItemsParams) {
  await db.transaction(async (tx) => {
    for (const items of Object.values(updatedItems)) {
      for (let i = 0; i < items.length; i++) {
        const { inspection_item_id: inspectionItemId } = items[i];

        await tx
          .update(inspectionItems)
          .set({ inspectionSortNumber: i + 1 })
          .where(
            and(
              eq(inspectionItems.inspectionItemId, inspectionItemId),
              eq(inspectionItems.facilityCode, facilityCode),
            ),
          );
      }
    }
  });
}
