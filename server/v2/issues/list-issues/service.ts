import { formatInTimeZone } from 'date-fns-tz';
import { and, asc, count, desc, eq, ilike, type SQL, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { issues } from '~/server/db/schema';

const sortColumnMap = {
  reportedDate: issues.reportedDate,
  reporter: issues.reporter,
  equipmentId: issues.equipmentId,
  location: issues.location,
  description: issues.description,
} as const;

export type SortRow = keyof typeof sortColumnMap;
export type SortOrder = 'asc' | 'desc';

export interface FilterCriteria {
  reportedDate?: string;
  equipmentId?: string;
  location?: string;
}

export interface ListIssuesParams {
  page: number;
  itemsPerPage: number;
  sortRow: SortRow;
  sortOrder: SortOrder;
  filterCriteria: FilterCriteria;
  facilityCode: string;
}

function buildFilterConditions(filterCriteria: FilterCriteria): SQL[] {
  const conditions: SQL[] = [];

  if (filterCriteria.reportedDate) {
    conditions.push(
      sql`(${issues.reportedDate} AT TIME ZONE 'Asia/Tokyo')::date = ${filterCriteria.reportedDate}`,
    );
  }
  if (filterCriteria.equipmentId) {
    conditions.push(
      ilike(issues.equipmentId, `%${filterCriteria.equipmentId}%`),
    );
  }
  if (filterCriteria.location) {
    conditions.push(ilike(issues.location, `%${filterCriteria.location}%`));
  }

  return conditions;
}

export async function listIssues({
  page,
  itemsPerPage,
  sortRow,
  sortOrder,
  filterCriteria,
  facilityCode,
}: ListIssuesParams) {
  const orderFn = sortOrder === 'asc' ? asc : desc;
  const whereCondition = and(
    eq(issues.facilityCode, facilityCode),
    ...buildFilterConditions(filterCriteria),
  );

  const rows = await db
    .select({
      issueId: issues.issueId,
      reportedDate: issues.reportedDate,
      reporter: issues.reporter,
      equipmentId: issues.equipmentId,
      location: issues.location,
      description: issues.description,
    })
    .from(issues)
    .where(whereCondition)
    .orderBy(orderFn(sortColumnMap[sortRow]))
    .limit(itemsPerPage)
    .offset((page - 1) * itemsPerPage);

  const formattedRows = rows.map((row) => ({
    ...row,
    reportedDate: row.reportedDate
      ? formatInTimeZone(row.reportedDate, 'Asia/Tokyo', 'yyyy-MM-dd')
      : row.reportedDate,
  }));

  const [{ total }] = await db
    .select({ total: count() })
    .from(issues)
    .where(whereCondition);

  return { items: formattedRows, total };
}
