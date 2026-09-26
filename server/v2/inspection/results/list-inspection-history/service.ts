import { formatInTimeZone } from 'date-fns-tz';
import { and, asc, desc, eq, ilike, type SQL, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import {
  equipmentLedger,
  inspectionItems,
  inspectionResults,
  users,
} from '~/server/db/schema';

const sortColumnMap = {
  inspectionDate: inspectionResults.inspectionDate,
  inspectionType: inspectionItems.inspectionType,
  userId: inspectionResults.userId,
  equipmentId: inspectionResults.equipmentId,
  equipmentName: equipmentLedger.equipmentName,
  equipmentModel: equipmentLedger.equipmentModel,
} as const;

export type SortRow = keyof typeof sortColumnMap;
export type SortOrder = 'asc' | 'desc';

export interface FilterCriteria {
  equipmentId?: string;
  equipmentType?: string;
  equipmentName?: string;
  equipmentModel?: string;
  equipmentSerialNumber?: string;
}

export interface ListInspectionHistoryParams {
  facilityCode: string;
  page: number;
  itemsPerPage: number;
  sortRow: SortRow;
  sortOrder: SortOrder;
  inspectionType?: string;
  filterCriteria: FilterCriteria;
}

function buildFilterConditions(filterCriteria: FilterCriteria): SQL[] {
  const conditions: SQL[] = [];

  if (filterCriteria.equipmentId) {
    conditions.push(
      ilike(equipmentLedger.equipmentId, `%${filterCriteria.equipmentId}%`),
    );
  }
  if (filterCriteria.equipmentType) {
    conditions.push(
      ilike(equipmentLedger.equipmentType, `%${filterCriteria.equipmentType}%`),
    );
  }
  if (filterCriteria.equipmentName) {
    conditions.push(
      ilike(equipmentLedger.equipmentName, `%${filterCriteria.equipmentName}%`),
    );
  }
  if (filterCriteria.equipmentModel) {
    conditions.push(
      ilike(
        equipmentLedger.equipmentModel,
        `%${filterCriteria.equipmentModel}%`,
      ),
    );
  }
  if (filterCriteria.equipmentSerialNumber) {
    conditions.push(
      ilike(
        equipmentLedger.equipmentSerialNumber,
        `%${filterCriteria.equipmentSerialNumber}%`,
      ),
    );
  }

  return conditions;
}

export async function listInspectionHistory({
  facilityCode,
  page,
  itemsPerPage,
  sortRow,
  sortOrder,
  inspectionType,
  filterCriteria,
}: ListInspectionHistoryParams) {
  const orderFn = sortOrder === 'asc' ? asc : desc;

  const whereCondition = and(
    eq(inspectionResults.facilityCode, facilityCode),
    ...buildFilterConditions(filterCriteria),
    ...(inspectionType
      ? [eq(inspectionItems.inspectionType, inspectionType)]
      : []),
  );

  const rows = await db
    .select({
      equipmentId: inspectionResults.equipmentId,
      equipmentSerialNumber: inspectionResults.equipmentSerialNumber,
      equipmentName: equipmentLedger.equipmentName,
      equipmentModel: equipmentLedger.equipmentModel,
      equipmentManufacturer: equipmentLedger.equipmentManufacturer,
      inspectionDate: inspectionResults.inspectionDate,
      userId: inspectionResults.userId,
      userName: users.userName,
      inspectionType: inspectionItems.inspectionType,
      inspectionResults: sql<
        Record<
          string,
          { resultId: string; result: string; notes: string | null }
        >
      >`jsonb_object_agg(
        ${inspectionResults.inspectionItemId},
        jsonb_build_object(
          'resultId', ${inspectionResults.resultId},
          'result', ${inspectionResults.result},
          'notes', ${inspectionResults.resultNotes}
        )
      )`,
    })
    .from(inspectionResults)
    .innerJoin(
      inspectionItems,
      eq(inspectionResults.inspectionItemId, inspectionItems.inspectionItemId),
    )
    .innerJoin(
      equipmentLedger,
      and(
        eq(inspectionResults.equipmentId, equipmentLedger.equipmentId),
        eq(
          inspectionResults.equipmentSerialNumber,
          equipmentLedger.equipmentSerialNumber,
        ),
      ),
    )
    .innerJoin(users, eq(inspectionResults.userId, users.userId))
    .where(whereCondition)
    .groupBy(
      inspectionResults.equipmentId,
      inspectionResults.equipmentSerialNumber,
      equipmentLedger.equipmentName,
      equipmentLedger.equipmentModel,
      equipmentLedger.equipmentManufacturer,
      inspectionResults.inspectionDate,
      inspectionResults.userId,
      users.userName,
      inspectionItems.inspectionType,
    )
    .orderBy(orderFn(sortColumnMap[sortRow]))
    .limit(itemsPerPage)
    .offset((page - 1) * itemsPerPage);

  const formattedRows = rows.map((row) => ({
    ...row,
    inspectionDate: row.inspectionDate
      ? formatInTimeZone(row.inspectionDate, 'Asia/Tokyo', 'yyyy-MM-dd')
      : row.inspectionDate,
  }));

  const [{ total }] = await db
    .select({
      total: sql<string>`COUNT(DISTINCT (${inspectionResults.equipmentId}, ${inspectionResults.equipmentSerialNumber}, ${inspectionResults.inspectionDate}, ${inspectionResults.userId}))`,
    })
    .from(inspectionResults)
    .innerJoin(
      inspectionItems,
      eq(inspectionResults.inspectionItemId, inspectionItems.inspectionItemId),
    )
    .innerJoin(
      equipmentLedger,
      and(
        eq(inspectionResults.equipmentId, equipmentLedger.equipmentId),
        eq(
          inspectionResults.equipmentSerialNumber,
          equipmentLedger.equipmentSerialNumber,
        ),
      ),
    )
    .where(whereCondition);

  return { items: formattedRows, total: Number(total) };
}
