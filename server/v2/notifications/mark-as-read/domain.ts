import { z } from 'zod';

export const markAsReadRequestSchema = z.object({
  is_viewed: z.boolean(),
  notificationId: z.number().int().positive(),
});
