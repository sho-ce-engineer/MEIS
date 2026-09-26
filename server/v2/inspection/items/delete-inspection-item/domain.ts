import { z } from 'zod';

export const deleteInspectionItemRequestSchema = z.object({
  inspectionItemId: z.string().min(1),
});
