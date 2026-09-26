import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { inspectionItems } from '~/server/db/schema';
import {
  type NumericValue,
  toNumericColumn,
} from '~/server/v2/inspection/items/lib/toNumericColumn';

export interface UpdateInspectionItemParams {
  facilityCode: string;
  inspectionItemId: string;
  inspectionType: string;
  inspectionItemCategory: string;
  inspectionItem: string;
  inspectionItemDescription?: string;
  inspectionComponentType: string;
  inspectionSortNumber: number;
  min?: NumericValue;
  max?: NumericValue;
  suffix?: string;
  lowerLimit?: NumericValue;
  upperLimit?: NumericValue;
}

export async function updateInspectionItem({
  facilityCode,
  inspectionItemId,
  inspectionType,
  inspectionItemCategory,
  inspectionItem,
  inspectionItemDescription,
  inspectionComponentType,
  inspectionSortNumber,
  min,
  max,
  suffix,
  lowerLimit,
  upperLimit,
}: UpdateInspectionItemParams) {
  const [row] = await db
    .update(inspectionItems)
    .set({
      inspectionType,
      inspectionItemCategory,
      inspectionItem,
      inspectionItemDescription,
      inspectionComponentType,
      inspectionSortNumber,
      min: toNumericColumn(min),
      max: toNumericColumn(max),
      suffix,
      lowerlimit: toNumericColumn(lowerLimit),
      upperlimit: toNumericColumn(upperLimit),
    })
    .where(
      and(
        eq(inspectionItems.inspectionItemId, inspectionItemId),
        eq(inspectionItems.facilityCode, facilityCode),
      ),
    )
    .returning();

  return row;
}
