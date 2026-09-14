import { z } from 'zod';

export const listIssuesRequestSchema = z.object({
  page: z.number().int().min(1).default(1),
  itemsPerPage: z.number().int().min(1).max(100).default(10),
  sortRow: z
    .enum([
      'reported_date',
      'reporter',
      'equipment_id',
      'location',
      'description',
    ])
    .default('reported_date'),
  sortByOrder: z.enum(['asc', 'desc']).default('desc'),
  filterCriteria: z
    .object({
      reported_date: z.string().optional(),
      equipment_id: z.string().optional(),
      location: z.string().optional(),
    })
    .default({}),
});
