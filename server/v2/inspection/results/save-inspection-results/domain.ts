import { z } from 'zod';

export const saveInspectionResultsRequestSchema = z.object({
  results: z
    .array(
      z.object({
        resultId: z.string().min(1),
        userId: z.string().min(1),
        inspectionItemId: z.string().min(1),
        equipmentId: z.string().min(1),
        equipmentSerialNumber: z.string().min(1),
        result: z.union([z.string(), z.number()]),
        notes: z.string().optional(),
        inspectionDate: z.string().min(1),
      }),
    )
    .min(1),
});
