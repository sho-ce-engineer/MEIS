import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { equipmentLedger } from '~/server/db/schema';

export interface GetEquipmentDetailParams {
  facilityCode: string;
  equipmentId: string;
}

export const getEquipmentDetails = async ({
  facilityCode,
  equipmentId,
}: GetEquipmentDetailParams) => {
  const [row] = await db
    .select({
      equipmentName: equipmentLedger.equipmentName,
      equipmentModel: equipmentLedger.equipmentModel,
      equipmentSerialNumber: equipmentLedger.equipmentSerialNumber,
      equipmentType: equipmentLedger.equipmentType,
    })
    .from(equipmentLedger)
    .where(
      and(
        eq(equipmentLedger.equipmentId, equipmentId),
        eq(equipmentLedger.facilityCode, facilityCode),
      ),
    );
  return row;
};
