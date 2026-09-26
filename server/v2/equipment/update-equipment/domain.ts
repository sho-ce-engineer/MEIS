import { z } from 'zod';
import { equipmentFieldsSchema } from '~/server/v2/equipment/lib/equipmentFieldsSchema';

export const updateEquipmentRequestSchema = z.object({
  updatedItem: equipmentFieldsSchema,
});
