import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { equipmentLedger } from '~/server/db/schema';

export interface ListEquipmentTypeParams {
  facilityCode: string;
}

export async function listEquipmentTypes({
  facilityCode,
}: ListEquipmentTypeParams) {
  const rows = await db
    .selectDistinct({ equipmentType: equipmentLedger.equipmentType })
    .from(equipmentLedger)
    .where(eq(equipmentLedger.facilityCode, facilityCode));

  return rows;
}
