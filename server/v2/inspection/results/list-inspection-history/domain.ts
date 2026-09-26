import { z } from 'zod';

export const listInspectionHistoryRequestSchema = z.object({
  page: z.number().int().min(1).default(1),
  itemsPerPage: z.number().int().min(1).default(10),
  sortRow: z
    .enum([
      'inspectionDate',
      'inspectionType',
      'userId',
      'equipmentId',
      'equipmentName',
      'equipmentModel',
    ])
    .default('inspectionDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  inspectionType: z.string().optional(),
  filterCriteria: z
    .object({
      equipmentId: z.string().optional(),
      equipmentType: z.string().optional(),
      equipmentName: z.string().optional(),
      equipmentModel: z.string().optional(),
      equipmentSerialNumber: z.string().optional(),
    })
    .default({}),
});
