import { z } from 'zod';

export const deleteIssueRequestSchema = z.object({
  issue_id: z.string().min(1),
});
