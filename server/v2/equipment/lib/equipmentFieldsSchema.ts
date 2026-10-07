import { z } from 'zod';
import { normalizeAcquisitionDate } from './normalizeAcquisitionDate';

const optionalTextSchema = z.string().nullable().optional();

const acquisitionDateSchema = optionalTextSchema.transform((value, ctx) => {
  if (value === undefined || value === null) return value;

  const normalized = normalizeAcquisitionDate(value);
  if (normalized === undefined) {
    ctx.addIssue({
      code: 'custom',
      message: '購入日の形式が正しくありません。',
    });
    return z.NEVER;
  }
  return normalized;
});

export const equipmentFieldsSchema = z.object({
  equipmentId: z.string().min(1),
  equipmentName: z.string().min(1),
  equipmentModel: optionalTextSchema,
  equipmentManufacturer: optionalTextSchema,
  equipmentSerialNumber: optionalTextSchema,
  equipmentType: optionalTextSchema,
  acquisitionDate: acquisitionDateSchema,
  equipmentStatus: optionalTextSchema,
  equipmentNotes: optionalTextSchema,
  equipmentMaintenanceContract: optionalTextSchema,
  equipmentStorageLocation: optionalTextSchema,
});

export type EquipmentFields = z.infer<typeof equipmentFieldsSchema>;
