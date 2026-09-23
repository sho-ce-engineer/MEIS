import { and, eq, inArray } from 'drizzle-orm';
import { db } from '~/server/db';
import { inspectionItems } from '~/server/db/schema';

export interface ListInspectionItemDetailsParams {
  facilityCode: string;
  inspectionItemIds: string[];
}

export async function listInspectionItemDetails({
  facilityCode,
  inspectionItemIds,
}: ListInspectionItemDetailsParams) {
  const rows = await db
    .select({
      inspectionItemId: inspectionItems.inspectionItemId,
      inspectionItem: inspectionItems.inspectionItem,
      inspectionItemDescription: inspectionItems.inspectionItemDescription,
      inspectionItemCategory: inspectionItems.inspectionItemCategory,
      inspectionSortNumber: inspectionItems.inspectionSortNumber,
      suffix: inspectionItems.suffix,
    })
    .from(inspectionItems)
    .where(
      and(
        inArray(inspectionItems.inspectionItemId, inspectionItemIds),
        eq(inspectionItems.facilityCode, facilityCode),
      ),
    );

  return rows;
}
