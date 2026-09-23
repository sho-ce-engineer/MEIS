import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { inspectionItems } from '~/server/db/schema';

export interface UpdateInspectionItemParams {
  facilityCode: string;
  inspectionItemId: string;
  inspectionType: string;
  inspectionItemCategory: string;
  inspectionItem: string;
  inspectionItemDescription?: string;
  inspectionComponentType: string;
  inspectionSortNumber: number;
  min?: number;
  max?: number;
  suffix?: string;
  lowerlimit?: number;
  upperlimit?: number;
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
  lowerlimit,
  upperlimit,
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
      min: min?.toString(),
      max: max?.toString(),
      suffix,
      lowerlimit: lowerlimit?.toString(),
      upperlimit: upperlimit?.toString(),
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
