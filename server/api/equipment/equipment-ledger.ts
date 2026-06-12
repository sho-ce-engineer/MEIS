import pool from '~/server/config/db';
import { parseISO, format } from 'date-fns';

interface EquipmentLedgerRequestBody {
  page?: number;
  itemsPerPage?: number;
  sortRow?: string;
  sortByOrder?: string;
  search?: string;
  filterCriteria?: Record<string, string>;
}

// フィルタリングに使用できるキーのリスト
const ALLOWED_FILTER_KEYS = [
  'equipment_id',
  'equipment_type',
  'equipment_manufacturer',
  'equipment_name',
  'equipment_model',
  'equipment_serial_number',
  'equipment_status',
  'equipment_maintenance_contract',
];

const addFilterConditions = (
  query: string,
  params: any[],
  filteredCriteria: Record<string, string>,
  search: string,
): { query: string; params: any[] } => {
  for (const [key, value] of Object.entries(filteredCriteria)) {
    if (!ALLOWED_FILTER_KEYS.includes(key)) continue;
    query += ` AND ${key} ILIKE $${params.length + 1}`;
    params.push(`%${value}%`);
  }
  if (search) {
    query += ` AND equipment_name ILIKE $${params.length + 1}`;
    params.push(`%${search}%`);
  }
  return { query, params };
};

// ソートに使用できるキーと順序のリスト
const ALLOWED_SORT_KEYS = [
  'equipment_id',
  'equipment_type',
  'equipment_manufacturer',
  'equipment_name',
  'equipment_model',
  'equipment_serial_number',
  'acquisition_date',
];
const ALLOWED_SORT_ORDERS = ['asc', 'desc'];

export default defineEventHandler(async (event) => {
  // 認証ユーザーの取得
  const authenticatedUser = getAuthenticatedUser(event);

  // 認証ユーザーの施設コードを取得
  const authenticatedUserQuery = `
    SELECT facility_code FROM users
    WHERE user_id = $1
  `;

  const AuthenticatedUserFacilityResult = await pool.query(
    authenticatedUserQuery,
    [authenticatedUser.user_id],
  );
  if (AuthenticatedUserFacilityResult.rowCount === 0) {
    console.error(
      `[equipment-ledger] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const {
    page = 1,
    itemsPerPage = 10,
    sortRow = 'equipment_id',
    sortByOrder = 'asc',
    search = '',
    filterCriteria = {},
  } = await readBody<EquipmentLedgerRequestBody>(event);

  let query = `
    SELECT
      equipment_id,
      equipment_type,
      equipment_manufacturer,
      equipment_name,
      equipment_model,
      equipment_serial_number,
      equipment_status,
      acquisition_date,
      equipment_maintenance_contract
    FROM equipment_ledger
    WHERE facility_code = $1
  `;

  let queryParams: any = [facilityCode];

  // フィルタ条件から空の値を除外した上で作成
  const filteredCriteria = Object.fromEntries(
    Object.entries(filterCriteria).filter(([key, value]) => value !== ''),
  );

  // メインクエリの作成（フィルタ条件と検索条件を追加）
  ({ query, params: queryParams } = addFilterConditions(
    query,
    queryParams,
    filteredCriteria,
    search,
  ));

  // ソート条件と順序を設定
  const sortByKey = ALLOWED_SORT_KEYS.includes(sortRow ?? '')
    ? sortRow!
    : 'equipment_id';
  const sortOrderValue = ALLOWED_SORT_ORDERS.includes(sortByOrder ?? '')
    ? sortByOrder!
    : 'asc';

  // 並び順やページネーションを追加
  query += `
    ORDER BY ${sortByKey} ${sortOrderValue}
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
  `;
  queryParams.push(itemsPerPage, (page - 1) * itemsPerPage);

  try {
    const result = await pool.query(query, queryParams);

    // 日付フォーマットの整形
    const formattedAcquisition = result.rows.map((row) => {
      let acquisitionDate;
      if (row.acquisition_date == null) {
        acquisitionDate = null;
      } else if (typeof row.acquisition_date === 'string') {
        acquisitionDate = !isNaN(Date.parse(row.acquisition_date))
          ? row.acquisition_date
          : null;
      } else if (row.acquisition_date instanceof Date) {
        acquisitionDate = row.acquisition_date.toISOString();
      } else {
        acquisitionDate = null;
      }

      return {
        ...row,
        acquisition_date: acquisitionDate
          ? format(parseISO(acquisitionDate), 'yyyy-MM-dd')
          : null,
      };
    });

    // データの合計数を取得
    let totalQuery = `SELECT COUNT(*) FROM equipment_ledger WHERE facility_code = $1`;
    let totalParams = [facilityCode];

    // totalQueryにフィルタ条件と検索条件を追加
    ({ query: totalQuery, params: totalParams } = addFilterConditions(
      totalQuery,
      totalParams,
      filteredCriteria,
      search,
    ));

    const totalResult = await pool.query(totalQuery, totalParams);
    return {
      items: formattedAcquisition,
      total: totalResult.rows[0].count,
    };
  } catch (error) {
    console.error('[equipment-ledger] Error executing query:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'データの取得に失敗しました。' },
    });
  }
});
