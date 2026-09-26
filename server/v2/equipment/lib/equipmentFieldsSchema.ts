import { z } from 'zod';

const optionalTextSchema = z.string().nullable().optional();

export const equipmentFieldsSchema = z.object({
  equipmentId: z.string().min(1),
  equipmentName: z.string().min(1),
  equipmentModel: optionalTextSchema,
  equipmentManufacturer: optionalTextSchema,
  equipmentSerialNumber: optionalTextSchema,
  equipmentType: optionalTextSchema,
  acquisitionDate: optionalTextSchema,
  equipmentStatus: optionalTextSchema,
  equipmentNotes: optionalTextSchema,
  equipmentMaintenanceContract: optionalTextSchema,
  equipmentStorageLocation: optionalTextSchema,
});

export type EquipmentFields = z.infer<typeof equipmentFieldsSchema>;
