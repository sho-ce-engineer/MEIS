import { and, count, eq, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { issues } from '~/server/db/schema';

export async function getTodayIssuesCount(facilityCode: string) {
  const [{ count: todayCount }] = await db
    .select({ count: count() })
    .from(issues)
    .where(
      and(
        eq(issues.facilityCode, facilityCode),
        sql`(${issues.reportedDate} AT TIME ZONE 'Asia/Tokyo')::date
          = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo')::date`,
      ),
    );

  return todayCount;
}
