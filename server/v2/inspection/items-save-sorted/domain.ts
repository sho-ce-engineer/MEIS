import { z } from 'zod';

export const saveSortedInspectionItemsRequestSchema = z.object({
  updatedItems: z.record(
    z.string(),
    z.array(z.object({ inspection_item_id: z.string().min(1) })),
  ),
});
