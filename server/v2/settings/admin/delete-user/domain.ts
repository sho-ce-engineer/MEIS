import z from 'zod';

export const deleteUserRequestSchema = z.object({
  targetUserId: z.string().min(1),
});
