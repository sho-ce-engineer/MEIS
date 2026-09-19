import { z } from 'zod';

export const listInspectionHistoryRequestSchema = z.object({
  page: z.number().int().min(1).default(1),
  itemsPerPage: z.number().int().min(1).default(10),
  sortRow: z
    .enum([
      'inspection_date',
      'inspection_type',
      'user_id',
      'equipment_id',
      'equipment_name',
      'equipment_model',
    ])
    .default('inspection_date'),
  sortByOrder: z.enum(['asc', 'desc']).default('desc'),
  inspectionType: z.string().optional(),
  filterCriteria: z
    .object({
      equipment_id: z.string().optional(),
      equipment_type: z.string().optional(),
      equipment_name: z.string().optional(),
      equipment_model: z.string().optional(),
      equipment_serial_number: z.string().optional(),
    })
    .default({}),
});
