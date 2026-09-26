import { z } from 'zod';
import { equipmentFieldsSchema } from '~/server/v2/equipment/lib/equipmentFieldsSchema';

export const importEquipmentRequestSchema = z.object({
  ledgerData: z.array(equipmentFieldsSchema),
});
