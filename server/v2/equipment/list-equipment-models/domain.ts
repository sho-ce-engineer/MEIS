import { z } from 'zod';

export const listEquipmentModelsRequestSchema = z.object({
  equipmentType: z.string().min(1),
});
