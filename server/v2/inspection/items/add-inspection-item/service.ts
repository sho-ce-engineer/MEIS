import { and, eq, max } from 'drizzle-orm';
import { db } from '~/server/db';
import { inspectionItems } from '~/server/db/schema';
import { generateInspectionItemId } from '~/server/v2/inspection/items/lib/generateInspectionItemId';
import {
  type NumericValue,
  toNumericColumn,
} from '~/server/v2/inspection/items/lib/toNumericColumn';

export interface AddInspectionItemParams {
  facilityCode: string;
  inspectionType: string;
  inspectionItemCategory: string;
  inspectionItem: string;
  inspectionItemDescription?: string;
  inspectionComponentType: string;
  equipmentType: string;
  equipmentModel: string;
  min?: NumericValue;
  max?: NumericValue;
  suffix?: string;
  lowerLimit?: NumericValue;
  upperLimit?: NumericValue;
}

export async function addInspectionItem({
  facilityCode,
  inspectionType,
  inspectionItemCategory,
  inspectionItem,
  inspectionItemDescription,
  inspectionComponentType,
  equipmentType,
  equipmentModel,
  min,
  max: maxValue,
  suffix,
  lowerLimit,
  upperLimit,
}: AddInspectionItemParams) {
  const [{ maxSortNumber }] = await db
    .select({ maxSortNumber: max(inspectionItems.inspectionSortNumber) })
    .from(inspectionItems)
    .where(
      and(
        eq(inspectionItems.inspectionItemCategory, inspectionItemCategory),
        eq(inspectionItems.equipmentModel, equipmentModel),
        eq(inspectionItems.facilityCode, facilityCode),
      ),
    );

  const newSortNumber = (maxSortNumber ?? 0) + 1;

  const [row] = await db
    .insert(inspectionItems)
    .values({
      inspectionItemId: generateInspectionItemId(facilityCode),
      inspectionType,
      inspectionItemCategory,
      inspectionItem,
      inspectionItemDescription,
      inspectionComponentType,
      facilityCode,
      equipmentType,
      equipmentModel,
      inspectionSortNumber: newSortNumber,
      min: toNumericColumn(min),
      max: toNumericColumn(maxValue),
      suffix,
      lowerlimit: toNumericColumn(lowerLimit),
      upperlimit: toNumericColumn(upperLimit),
    })
    .returning();

  return row;
}
