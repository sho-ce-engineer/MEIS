import { z } from 'zod';

export const listInspectionTypesRequestSchema = z.object({
  equipmentModel: z.string().min(1),
});
