import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { issues } from '~/server/db/schema';

export interface DeleteIssueParams {
  facilityCode: string;
  issueId: string;
}

export async function deleteIssue({
  facilityCode,
  issueId,
}: DeleteIssueParams) {
  await db
    .delete(issues)
    .where(
      and(eq(issues.facilityCode, facilityCode), eq(issues.issueId, issueId)),
    );
}
