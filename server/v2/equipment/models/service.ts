import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { equipmentLedger } from '~/server/db/schema';

export interface ListEquipmentModelParams {
  facilityCode: string;
  equipmentType: string;
}

export async function listEquipmentModels({
  facilityCode,
  equipmentType,
}: ListEquipmentModelParams) {
  const rows = await db
    .selectDistinct({ equipmentModel: equipmentLedger.equipmentModel })
    .from(equipmentLedger)
    .where(
      and(
        eq(equipmentLedger.equipmentType, equipmentType),
        eq(equipmentLedger.facilityCode, facilityCode),
      ),
    );
  return rows;
}
