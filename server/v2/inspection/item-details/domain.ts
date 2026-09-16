import { z } from 'zod';

export const listInspectionItemDetailsRequestSchema = z.object({
  inspectionItemIds: z.array(z.string().min(1)).min(1),
});
