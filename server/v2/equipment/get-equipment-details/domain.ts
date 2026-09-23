import { z } from 'zod';

export const listEquipmentDetailsRequestSchema = z.object({
  equipmentId: z.string().min(1),
});
