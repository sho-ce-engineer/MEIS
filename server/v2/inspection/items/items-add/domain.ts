import { z } from 'zod';

export const addInspectionItemRequestSchema = z.object({
  inspection_type: z.string().min(1),
  inspection_item_category: z.string().min(1),
  inspection_item: z.string().min(1),
  inspection_item_description: z.string().optional(),
  inspection_component_type: z.string().min(1),
  equipment_type: z.string().min(1),
  equipment_model: z.string().min(1),
  min: z.number().optional(),
  max: z.number().optional(),
  suffix: z.string().optional(),
  lowerlimit: z.number().optional(),
  upperlimit: z.number().optional(),
});
