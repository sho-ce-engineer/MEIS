import { z } from 'zod';

const numericValueSchema = z
  .union([z.number(), z.string()])
  .nullable()
  .optional();

export const updateInspectionItemRequestSchema = z.object({
  inspectionItemId: z.string().min(1),
  inspectionType: z.string().min(1),
  inspectionItemCategory: z.string().min(1),
  inspectionItem: z.string().min(1),
  inspectionItemDescription: z.string().optional(),
  inspectionComponentType: z.string().min(1),
  equipmentType: z.string().min(1),
  equipmentModel: z.string().min(1),
  inspectionSortNumber: z.number(),
  min: numericValueSchema,
  max: numericValueSchema,
  suffix: z.string().optional(),
  lowerLimit: numericValueSchema,
  upperLimit: numericValueSchema,
});
