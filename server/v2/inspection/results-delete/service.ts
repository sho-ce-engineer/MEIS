import { and, eq, inArray } from 'drizzle-orm';
import { db } from '~/server/db';
import { inspectionResults } from '~/server/db/schema';

export interface DeleteInspectionResultsParams {
  facilityCode: string;
  resultIds: string[];
}

export async function deleteInspectionResults({
  facilityCode,
  resultIds,
}: DeleteInspectionResultsParams) {
  await db
    .delete(inspectionResults)
    .where(
      and(
        eq(inspectionResults.facilityCode, facilityCode),
        inArray(inspectionResults.resultId, resultIds),
      ),
    );
}
