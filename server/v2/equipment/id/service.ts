import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { equipmentLedger } from '~/server/db/schema';

export interface ListEquipmentIdParams {
  facilityCode: string;
}

export async function listEquipmentId({ facilityCode }: ListEquipmentIdParams) {
  const rows = await db
    .selectDistinct({
      equipmentId: equipmentLedger.equipmentId,
    })
    .from(equipmentLedger)
    .where(eq(equipmentLedger.facilityCode, facilityCode));

  return rows;
}
