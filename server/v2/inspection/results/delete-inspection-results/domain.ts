import { z } from 'zod';

export const deleteInspectionResultsRequestSchema = z.object({
  result_ids: z.array(z.string().min(1)).min(1),
});
