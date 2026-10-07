import { z } from 'zod';

export const inviteUserRequestSchema = z.strictObject({
  email: z.string().min(1),
});
