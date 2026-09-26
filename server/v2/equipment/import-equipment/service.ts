import { db } from '~/server/db';
import { equipmentLedger } from '~/server/db/schema';

export interface ImportEquipmentItem {
  equipmentId: string;
  equipmentName: string;
  equipmentModel?: string | null;
  equipmentManufacturer?: string | null;
  equipmentSerialNumber?: string | null;
  equipmentType?: string | null;
  acquisitionDate?: string | null;
  equipmentStatus?: string | null;
  equipmentNotes?: string | null;
  equipmentMaintenanceContract?: string | null;
  equipmentStorageLocation?: string | null;
}

export interface ImportEquipmentParams {
  facilityCode: string;
  ledgerData: ImportEquipmentItem[];
}

export const importEquipment = async ({
  facilityCode,
  ledgerData,
}: ImportEquipmentParams) => {
  await db.transaction(async (tx) => {
    for (const item of ledgerData) {
      await tx
        .insert(equipmentLedger)
        .values({
          ...item,
          facilityCode,
        })
        .onConflictDoNothing({
          target: [equipmentLedger.equipmentId, equipmentLedger.facilityCode],
        });
    }
  });
};
