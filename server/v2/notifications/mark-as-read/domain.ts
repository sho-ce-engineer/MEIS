import { z } from 'zod';

export const markAsReadRequestSchema = z.object({
  isViewed: z.boolean(),
  notificationId: z.number().int().positive(),
});
