import { z } from 'zod';

export const countInspectionResultsRequestSchema = z.object({
  jpyDate: z.string().min(1),
});
