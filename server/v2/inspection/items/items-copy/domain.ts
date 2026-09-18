import { z } from 'zod';

export const copyInspectionItemsRequestSchema = z.object({
  baseInspectionData: z.object({
    baseEquipmentType: z.string().min(1),
    baseEquipmentModel: z.string().min(1),
    baseInspectionType: z.string().min(1),
  }),
  targetInspectionData: z.object({
    targetEquipmentType: z.string().min(1),
    targetEquipmentModel: z.string().min(1),
    targetInspectionType: z.string().min(1),
  }),
});
