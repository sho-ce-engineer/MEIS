import { z } from 'zod';

export const listInspectionItemsRequestSchema = z.object({
  equipmentModel: z.string().min(1),
  inspectionType: z.string().min(1),
});
