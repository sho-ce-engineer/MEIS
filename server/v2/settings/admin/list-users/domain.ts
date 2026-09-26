import { z } from 'zod';

export const listUsersRequestSchema = z.object({
  page: z.number().optional(),
  itemsPerPage: z.number().optional(),
  sortRow: z.string().optional(),
  sortOrder: z.string().optional(),
});
