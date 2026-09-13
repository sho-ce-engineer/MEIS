import { z } from 'zod';

export const markAsReadRequestSchema = z.object({
  is_viewed: z.boolean(),
  notificationId: z
    .string()
    .min(1)
    .regex(/^\d+$/, '数値の文字列である必要があります'),
});
