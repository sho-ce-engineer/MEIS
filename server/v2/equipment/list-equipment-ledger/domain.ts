import { z } from 'zod';

export const listEquipmentLedgerRequestSchema = z.object({
  page: z.number().optional(),
  itemsPerPage: z.number().optional(),
  sortRow: z.string().optional(),
  sortOrder: z.string().optional(),
  search: z.string().optional(),
  filterCriteria: z.record(z.string(), z.string().nullable()).optional(),
});
