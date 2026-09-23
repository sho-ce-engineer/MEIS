import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { inspectionItems } from '~/server/db/schema';
import { generateInspectionItemId } from '~/server/v2/inspection/items/lib/generateInspectionItemId';

export interface CopyInspectionItemsParams {
  facilityCode: string;
  baseEquipmentType: string;
  baseEquipmentModel: string;
  baseInspectionType: string;
  targetEquipmentType: string;
  targetEquipmentModel: string;
  targetInspectionType: string;
}

export async function copyInspectionItems({
  facilityCode,
  baseEquipmentType,
  baseEquipmentModel,
  baseInspectionType,
  targetEquipmentType,
  targetEquipmentModel,
  targetInspectionType,
}: CopyInspectionItemsParams) {
  await db.transaction(async (tx) => {
    const baseRows = await tx
      .select({
        inspectionItemCategory: inspectionItems.inspectionItemCategory,
        inspectionItem: inspectionItems.inspectionItem,
        inspectionItemDescription: inspectionItems.inspectionItemDescription,
        inspectionComponentType: inspectionItems.inspectionComponentType,
        inspectionSortNumber: inspectionItems.inspectionSortNumber,
        min: inspectionItems.min,
        max: inspectionItems.max,
        suffix: inspectionItems.suffix,
        lowerlimit: inspectionItems.lowerlimit,
        upperlimit: inspectionItems.upperlimit,
      })
      .from(inspectionItems)
      .where(
        and(
          eq(inspectionItems.facilityCode, facilityCode),
          eq(inspectionItems.equipmentType, baseEquipmentType),
          eq(inspectionItems.equipmentModel, baseEquipmentModel),
          eq(inspectionItems.inspectionType, baseInspectionType),
        ),
      );

    for (const row of baseRows) {
      await tx.insert(inspectionItems).values({
        inspectionItemId: generateInspectionItemId(facilityCode),
        inspectionType: targetInspectionType,
        inspectionItemCategory: row.inspectionItemCategory,
        inspectionItem: row.inspectionItem,
        inspectionItemDescription: row.inspectionItemDescription,
        inspectionComponentType: row.inspectionComponentType,
        facilityCode,
        equipmentType: targetEquipmentType,
        equipmentModel: targetEquipmentModel,
        inspectionSortNumber: row.inspectionSortNumber,
        min: row.min,
        max: row.max,
        suffix: row.suffix,
        lowerlimit: row.lowerlimit,
        upperlimit: row.upperlimit,
      });
    }
  });
}
