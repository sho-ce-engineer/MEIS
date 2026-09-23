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
  inspection_date: inspectionResults.inspectionDate,
  inspection_type: inspectionItems.inspectionType,
  user_id: inspectionResults.userId,
  equipment_id: inspectionResults.equipmentId,
  equipment_name: equipmentLedger.equipmentName,
  equipment_model: equipmentLedger.equipmentModel,
} as const;

export type SortRow = keyof typeof sortColumnMap;
export type SortOrder = 'asc' | 'desc';

export interface FilterCriteria {
  equipment_id?: string;
  equipment_type?: string;
  equipment_name?: string;
  equipment_model?: string;
  equipment_serial_number?: string;
}

export interface ListInspectionHistoryParams {
  facilityCode: string;
  page: number;
  itemsPerPage: number;
  sortRow: SortRow;
  sortByOrder: SortOrder;
  inspectionType?: string;
  filterCriteria: FilterCriteria;
}

function buildFilterConditions(filterCriteria: FilterCriteria): SQL[] {
  const conditions: SQL[] = [];

  if (filterCriteria.equipment_id) {
    conditions.push(
      ilike(equipmentLedger.equipmentId, `%${filterCriteria.equipment_id}%`),
    );
  }
  if (filterCriteria.equipment_type) {
    conditions.push(
      ilike(
        equipmentLedger.equipmentType,
        `%${filterCriteria.equipment_type}%`,
      ),
    );
  }
  if (filterCriteria.equipment_name) {
    conditions.push(
      ilike(
        equipmentLedger.equipmentName,
        `%${filterCriteria.equipment_name}%`,
      ),
    );
  }
  if (filterCriteria.equipment_model) {
    conditions.push(
      ilike(
        equipmentLedger.equipmentModel,
        `%${filterCriteria.equipment_model}%`,
      ),
    );
  }
  if (filterCriteria.equipment_serial_number) {
    conditions.push(
      ilike(
        equipmentLedger.equipmentSerialNumber,
        `%${filterCriteria.equipment_serial_number}%`,
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
  sortByOrder,
  inspectionType,
  filterCriteria,
}: ListInspectionHistoryParams) {
  const orderFn = sortByOrder === 'asc' ? asc : desc;

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
