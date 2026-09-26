import { and, eq, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { equipmentLedger } from '~/server/db/schema';

export interface UpdateEquipmentParams {
  equipmentId: string;
  equipmentName: string;
  equipmentModel?: string | null;
  equipmentManufacturer?: string | null;
  equipmentSerialNumber?: string | null;
  equipmentType?: string | null;
  facilityCode: string;
  acquisitionDate?: string | null;
  equipmentStatus?: string | null;
  equipmentNotes?: string | null;
  equipmentMaintenanceContract?: string | null;
  equipmentStorageLocation?: string | null;
}

export const updateEquipment = async ({
  equipmentId,
  equipmentName,
  equipmentModel,
  equipmentManufacturer,
  equipmentSerialNumber,
  equipmentType,
  facilityCode,
  acquisitionDate,
  equipmentStatus,
  equipmentNotes,
  equipmentMaintenanceContract,
  equipmentStorageLocation,
}: UpdateEquipmentParams) => {
  const [row] = await db
    .update(equipmentLedger)
    .set({
      equipmentName,
      equipmentModel,
      equipmentManufacturer,
      equipmentSerialNumber,
      equipmentType,
      acquisitionDate,
      equipmentStatus,
      equipmentNotes,
      equipmentMaintenanceContract,
      equipmentStorageLocation,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(
      and(
        eq(equipmentLedger.equipmentId, equipmentId),
        eq(equipmentLedger.facilityCode, facilityCode),
      ),
    )
    .returning();

  return row;
};
