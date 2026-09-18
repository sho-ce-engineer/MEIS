import { formatInTimeZone } from 'date-fns-tz';
import { and, eq, max } from 'drizzle-orm';
import { db } from '~/server/db';
import { inspectionItems } from '~/server/db/schema';

export interface AddInspectionItemParams {
  facilityCode: string;
  inspectionType: string;
  inspectionItemCategory: string;
  inspectionItem: string;
  inspectionItemDescription?: string;
  inspectionComponentType: string;
  equipmentType: string;
  equipmentModel: string;
  min?: number;
  max?: number;
  suffix?: string;
  lowerlimit?: number;
  upperlimit?: number;
}

function generateInspectionItemId(facilityCode: string): string {
  const yyyymmddhhmmss = formatInTimeZone(
    new Date(),
    'Asia/Tokyo',
    'yyyyMMddHHmmss',
  );
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `${facilityCode}InspItemId${yyyymmddhhmmss}R${randomNumber}`;
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
  lowerlimit,
  upperlimit,
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
      min: min?.toString(),
      max: maxValue?.toString(),
      suffix,
      lowerlimit: lowerlimit?.toString(),
      upperlimit: upperlimit?.toString(),
    })
    .returning();

  return row;
}
