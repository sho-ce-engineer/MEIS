import { and, eq, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { inspectionResults } from '~/server/db/schema';

export interface CountInspectionResultsParams {
  facilityCode: string;
  jpyDate: string;
}

export async function countInspectionResults({
  facilityCode,
  jpyDate,
}: CountInspectionResultsParams) {
  const [{ count: resultCount }] = await db
    .select({
      count: sql<string>`COUNT(DISTINCT ${inspectionResults.inspectionDate})`,
    })
    .from(inspectionResults)
    .where(
      and(
        eq(inspectionResults.facilityCode, facilityCode),
        sql`(${inspectionResults.inspectionDate} AT TIME ZONE 'Asia/Tokyo')::date = ${jpyDate}::date`,
      ),
    );

  return Number(resultCount);
}
