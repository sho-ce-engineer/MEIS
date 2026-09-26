import { z } from 'zod';

export const deleteInspectionResultsRequestSchema = z.object({
  resultIds: z.array(z.string().min(1)).min(1),
});
