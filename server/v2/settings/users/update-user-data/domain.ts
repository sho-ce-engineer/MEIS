import { z } from 'zod';

export const updateUserDataRequestSchema = z.object({
  userName: z.string().min(1),
  userEmail: z.string().min(1),
  password: z.string().optional(),
});
