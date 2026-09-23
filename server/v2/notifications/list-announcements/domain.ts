import { z } from 'zod';

export const listAnnouncementsRequestSchema = z.object({
  page: z.number().int().min(1).default(1),
  itemsPerPage: z.number().int().min(1).max(100).default(10),
  sortRow: z
    .enum(['created_at', 'importance_level', 'title'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
