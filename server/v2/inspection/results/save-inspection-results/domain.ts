import { z } from 'zod';

export const saveInspectionResultsRequestSchema = z.object({
  results: z
    .array(
      z.object({
        result_id: z.string().min(1),
        user_id: z.string().min(1),
        inspection_item_id: z.string().min(1),
        equipment_id: z.string().min(1),
        equipment_serial_number: z.string().min(1),
        result: z.union([z.string(), z.number()]),
        notes: z.string().optional(),
        inspection_date: z.string().min(1),
      }),
    )
    .min(1),
});
