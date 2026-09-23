import { z } from 'zod';

export const updateUserRoleRequestSchema = z.object({
  targetUserId: z.string().min(1),
  newUserRole: z.enum(['admin', 'general'], {
    message: '入力された権限名に誤りがあります。',
  }),
});
