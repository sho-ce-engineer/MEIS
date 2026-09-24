import { z } from 'zod';

export const inviteUserRequestSchema = z.object({
  invitedByUserId: z.string().min(1),
  invitedByUserName: z.string().min(1),
  email: z.string().min(1),
});
