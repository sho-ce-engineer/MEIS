import { z } from 'zod';

export const listEquipmentLedgerRequestSchema = z.object({
  page: z.number().optional(),
  itemsPerPage: z.number().optional(),
  sortRow: z.string().optional(),
  sortByOrder: z.string().optional(),
  search: z.string().optional(),
  filterCriteria: z.record(z.string(), z.string()).optional(),
});
