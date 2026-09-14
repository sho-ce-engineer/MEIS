import { z } from 'zod';

export const deleteInspectionItemRequestSchema = z.object({
  inspection_item_id: z.string().min(1),
});
