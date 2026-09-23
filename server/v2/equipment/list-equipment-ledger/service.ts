import { and, asc, count, desc, eq, ilike, type SQL } from 'drizzle-orm';
import { db } from '~/server/db';
import { equipmentLedger } from '~/server/db/schema';

const sortColumnMap = {
  equipment_id: equipmentLedger.equipmentId,
  equipment_type: equipmentLedger.equipmentType,
  equipment_manufacturer: equipmentLedger.equipmentManufacturer,
  equipment_name: equipmentLedger.equipmentName,
  equipment_model: equipmentLedger.equipmentModel,
  equipment_serial_number: equipmentLedger.equipmentSerialNumber,
  acquisition_date: equipmentLedger.acquisitionDate,
} as const;

export type SortRow = keyof typeof sortColumnMap;
export type SortOrder = 'asc' | 'desc';

const FILTER_COLUMN_MAP = {
  equipment_id: equipmentLedger.equipmentId,
  equipment_type: equipmentLedger.equipmentType,
  equipment_manufacturer: equipmentLedger.equipmentManufacturer,
  equipment_name: equipmentLedger.equipmentName,
  equipment_model: equipmentLedger.equipmentModel,
  equipment_serial_number: equipmentLedger.equipmentSerialNumber,
  equipment_status: equipmentLedger.equipmentStatus,
  equipment_maintenance_contract: equipmentLedger.equipmentMaintenanceContract,
} as const;

export type FilterCriteria = Partial<
  Record<keyof typeof FILTER_COLUMN_MAP, string>
>;

export interface ListEquipmentLedgerParams {
  facilityCode: string;
  page: number;
  itemsPerPage: number;
  sortRow: SortRow;
  sortByOrder: SortOrder;
  search?: string;
  filterCriteria: FilterCriteria;
}

function buildFilterConditions(
  filterCriteria: FilterCriteria,
  search?: string,
): SQL[] {
  const conditions: SQL[] = [];

  for (const [key, value] of Object.entries(filterCriteria)) {
    if (!value) continue;
    const column = FILTER_COLUMN_MAP[key as keyof typeof FILTER_COLUMN_MAP];
    if (!column) continue;
    conditions.push(ilike(column, `%${value}%`));
  }

  if (search) {
    conditions.push(ilike(equipmentLedger.equipmentName, `%${search}%`));
  }

  return conditions;
}

export async function listEquipmentLedger({
  facilityCode,
  page,
  itemsPerPage,
  sortRow,
  sortByOrder,
  search,
  filterCriteria,
}: ListEquipmentLedgerParams) {
  const orderFn = sortByOrder === 'asc' ? asc : desc;
  const whereCondition = and(
    eq(equipmentLedger.facilityCode, facilityCode),
    ...buildFilterConditions(filterCriteria, search),
  );

  const rows = await db
    .select({
      equipmentId: equipmentLedger.equipmentId,
      equipmentType: equipmentLedger.equipmentType,
      equipmentManufacturer: equipmentLedger.equipmentManufacturer,
      equipmentName: equipmentLedger.equipmentName,
      equipmentModel: equipmentLedger.equipmentModel,
      equipmentSerialNumber: equipmentLedger.equipmentSerialNumber,
      equipmentStatus: equipmentLedger.equipmentStatus,
      acquisitionDate: equipmentLedger.acquisitionDate,
      equipmentMaintenanceContract:
        equipmentLedger.equipmentMaintenanceContract,
    })
    .from(equipmentLedger)
    .where(whereCondition)
    .orderBy(orderFn(sortColumnMap[sortRow]))
    .limit(itemsPerPage)
    .offset((page - 1) * itemsPerPage);

  const [{ total }] = await db
    .select({ total: count() })
    .from(equipmentLedger)
    .where(whereCondition);

  return { items: rows, total };
}
