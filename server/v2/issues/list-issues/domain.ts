import { z } from 'zod';

export const listIssuesRequestSchema = z.object({
  page: z.number().int().min(1).default(1),
  itemsPerPage: z.number().int().min(1).default(10),
  sortRow: z
    .enum([
      'reportedDate',
      'reporter',
      'equipmentId',
      'location',
      'description',
    ])
    .default('reportedDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  filterCriteria: z
    .object({
      reportedDate: z.string().optional(),
      equipmentId: z.string().optional(),
      location: z.string().optional(),
    })
    .default({}),
});
