import { z } from 'zod';

export const addSessionRequestSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  recaptchaToken: z.string(),
});
