import { z } from 'zod';

export const deleteIssueRequestSchema = z.object({
  issueId: z.string().min(1),
});
