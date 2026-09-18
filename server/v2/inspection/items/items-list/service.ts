import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { inspectionItems } from '~/server/db/schema';

export interface ListInspectionItemsParams {
  facilityCode: string;
  equipmentModel: string;
  inspectionType: string;
}

const categoryOrder = sql`
  CASE
    WHEN ${inspectionItems.inspectionItemCategory} = '外装点検' THEN 1
    WHEN ${inspectionItems.inspectionItemCategory} = '機能点検' THEN 2
    WHEN ${inspectionItems.inspectionItemCategory} = '実測点検' THEN 3
    WHEN ${inspectionItems.inspectionItemCategory} = '警報点検' THEN 4
    ELSE 5
  END
`;

export async function listInspectionItems({
  facilityCode,
  equipmentModel,
  inspectionType,
}: ListInspectionItemsParams) {
  const rows = await db
    .select({
      inspectionType: inspectionItems.inspectionType,
      inspectionItemId: inspectionItems.inspectionItemId,
      inspectionItemCategory: inspectionItems.inspectionItemCategory,
      inspectionItem: inspectionItems.inspectionItem,
      inspectionItemDescription: inspectionItems.inspectionItemDescription,
      inspectionComponentType: inspectionItems.inspectionComponentType,
      suffix: inspectionItems.suffix,
      min: inspectionItems.min,
      max: inspectionItems.max,
      lowerlimit: inspectionItems.lowerlimit,
      upperlimit: inspectionItems.upperlimit,
      inspectionSortNumber: inspectionItems.inspectionSortNumber,
    })
    .from(inspectionItems)
    .where(
      and(
        eq(inspectionItems.equipmentModel, equipmentModel),
        eq(inspectionItems.inspectionType, inspectionType),
        eq(inspectionItems.facilityCode, facilityCode),
      ),
    )
    .orderBy(categoryOrder, asc(inspectionItems.inspectionSortNumber));

  return rows;
}
