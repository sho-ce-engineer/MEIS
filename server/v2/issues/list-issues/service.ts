import { formatInTimeZone } from 'date-fns-tz';
import { and, asc, count, desc, eq, ilike, type SQL, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { issues } from '~/server/db/schema';

const sortColumnMap = {
  reported_date: issues.reportedDate,
  reporter: issues.reporter,
  equipment_id: issues.equipmentId,
  location: issues.location,
  description: issues.description,
} as const;

export type SortRow = keyof typeof sortColumnMap;
export type SortOrder = 'asc' | 'desc';

export interface FilterCriteria {
  reported_date?: string;
  equipment_id?: string;
  location?: string;
}

export interface ListIssuesParams {
  page: number;
  itemsPerPage: number;
  sortRow: SortRow;
  sortByOrder: SortOrder;
  filterCriteria: FilterCriteria;
  facilityCode: string;
}

function buildFilterConditions(filterCriteria: FilterCriteria): SQL[] {
  const conditions: SQL[] = [];

  if (filterCriteria.reported_date) {
    conditions.push(
      sql`(${issues.reportedDate} AT TIME ZONE 'Asia/Tokyo')::date = ${filterCriteria.reported_date}`,
    );
  }
  if (filterCriteria.equipment_id) {
    conditions.push(
      ilike(issues.equipmentId, `%${filterCriteria.equipment_id}%`),
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
  sortByOrder,
  filterCriteria,
  facilityCode,
}: ListIssuesParams) {
  const orderFn = sortByOrder === 'asc' ? asc : desc;
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
