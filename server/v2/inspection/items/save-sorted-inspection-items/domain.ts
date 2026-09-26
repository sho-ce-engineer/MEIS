import { z } from 'zod';

export const saveSortedInspectionItemsRequestSchema = z.object({
  updatedItems: z.record(
    z.string(),
    z.array(z.object({ inspectionItemId: z.string().min(1) })),
  ),
});
