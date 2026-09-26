import { z } from 'zod';

export const addUserRequestSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  userName: z.string().min(1),
  facilityName: z.string().optional(),
  inviteCode: z.string().optional(),
  recaptchaToken: z.string(),
});
