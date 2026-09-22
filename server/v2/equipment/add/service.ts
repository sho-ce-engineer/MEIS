import { db } from '~/server/db';
import { equipmentLedger } from '~/server/db/schema';

export interface AddEquipmentParams {
  equipmentId: string;
  equipmentName: string;
  equipmentModel?: string;
  equipmentManufacturer?: string;
  equipmentSerialNumber?: string;
  equipmentType?: string;
  facilityCode: string;
  acquisitionDate?: string | null;
  equipmentStatus?: string;
  equipmentNotes?: string;
  equipmentMaintenanceContract?: string;
  equipmentStorageLocation?: string;
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
