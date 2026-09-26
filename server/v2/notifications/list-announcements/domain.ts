import { z } from 'zod';

export const listAnnouncementsRequestSchema = z.object({
  page: z.number().int().min(1).default(1),
  itemsPerPage: z.number().int().min(1).default(10),
  sortRow: z
    .enum(['createdAt', 'importanceLevel', 'title'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
