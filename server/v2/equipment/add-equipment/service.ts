import { db } from '~/server/db';
import { equipmentLedger } from '~/server/db/schema';

export interface AddEquipmentParams {
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

export const addEquipment = async ({
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
}: AddEquipmentParams) => {
  await db.insert(equipmentLedger).values({
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
  });
};
