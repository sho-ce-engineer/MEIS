import { z } from 'zod';

export const listUsersRequestSchema = z.object({
  page: z.number().optional(),
  itemsPerPage: z.number().optional(),
  sortRow: z.string().optional(),
  sortByOrder: z.string().optional(),
});
