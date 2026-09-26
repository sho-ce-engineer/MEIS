import { z } from 'zod';

export const addIssueRequestSchema = z.object({
  reportedDate: z.string().min(1),
  reporter: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  equipmentId: z.string().min(1),
});
