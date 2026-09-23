import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { equipmentLedger } from '~/server/db/schema';

export interface ListEquipmentManufacturerParams {
  facilityCode: string;
}

export async function listEquipmentManufacturer({
  facilityCode,
}: ListEquipmentManufacturerParams) {
  const rows = await db
    .selectDistinct({
      equipmentManufacturer: equipmentLedger.equipmentManufacturer,
    })
    .from(equipmentLedger)
    .where(eq(equipmentLedger.facilityCode, facilityCode));

  return rows;
}
