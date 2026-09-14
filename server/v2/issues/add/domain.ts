import { z } from 'zod';

export const addIssueRequestSchema = z.object({
  reported_date: z.string().min(1),
  reporter: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  equipment_id: z.string().min(1),
});
