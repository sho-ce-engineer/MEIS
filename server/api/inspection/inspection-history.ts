import pool from '~/server/config/db';
import { parseISO, format } from 'date-fns';

interface InspectionHistoryRequestBody {
  page?: number;
  itemsPerPage?: number;
  sortRow?: string;
  sortByOrder?: string;
  inspectionType: string;
  filterCriteria?: Record<string, string>;
}

// ソートに使用できるキーと順序のリスト
const ALLOWED_SORT_KEYS = [
  'inspection_date',
  'inspection_type',
  'user_id',
  'equipment_id',
  'equipment_name',
  'equipment_model',
];

const ALLOWED_SORT_ORDERS = ['asc', 'desc'];

// フィルタリングに使用できるキーのリスト
const ALLOWED_FILTER_KEYS = [
  'equipment_id',
  'equipment_type',
  'equipment_name',
  'equipment_model',
  'equipment_serial_number',
];

//フィルタリング条件クエリの作成
const KEY_TABLE_MAP: Record<string, string> = {
  equipment_id: 'el',
  equipment_type: 'el',
  equipment_name: 'el',
  equipment_model: 'el',
  equipment_serial_number: 'el',
};

const addFilterConditions = (
  query: string,
  params: any[],
  filteredCriteria: Record<string, string>,
): { query: string; params: any[] } => {
  for (const [key, value] of Object.entries(filteredCriteria)) {
    if (!ALLOWED_FILTER_KEYS.includes(key)) continue;
    const alias = KEY_TABLE_MAP[key];
    query += ` AND ${alias}.${key} ILIKE $${params.length + 1}`;
    params.push(`%${value}%`);
  }
  return { query, params };
};

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
      `[inspection-history] Facility code not found for user_id: ${authenticatedUser.user_id}`,
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
    sortRow = 'inspection_date',
    sortByOrder = 'desc',
    inspectionType,
    filterCriteria = {},
  } = await readBody<InspectionHistoryRequestBody>(event);

  let query = `
    SELECT 
      ir.equipment_id,
      ir.equipment_serial_number,
      el.equipment_name,
      el.equipment_model,
      el.equipment_manufacturer,
      ir.inspection_date,
      ir.user_id,
      u.user_name,
      i.inspection_type,
      jsonb_object_agg(ir.inspection_item_id, jsonb_build_object('result_id', ir.result_id,'result', ir.result, 'notes', ir.result_notes)) AS inspection_results
    FROM 
      inspection_results ir
    JOIN 
      inspection_items i ON ir.inspection_item_id = i.inspection_item_id
    JOIN 
      equipment_ledger el ON ir.equipment_id = el.equipment_id 
      AND ir.equipment_serial_number = el.equipment_serial_number
    JOIN 
      users u ON ir.user_id = u.user_id
    WHERE 
      ir.facility_code = $1
  `;

  let queryParams: any = [facilityCode];

  // フィルタ条件から空の値を除外した上で作成
  const validFilterCriteria = Object.fromEntries(
    Object.entries(filterCriteria).filter(([key, value]) => value !== ''),
  );

  // メインクエリの作成（フィルタ条件と検索条件を追加）
  ({ query, params: queryParams } = addFilterConditions(
    query,
    queryParams,
    validFilterCriteria,
  ));

  // ソート条件と順序を設定
  const sortByKey = ALLOWED_SORT_KEYS.includes(sortRow ?? '')
    ? sortRow!
    : 'inspection_date';
  const sortOrderValue = ALLOWED_SORT_ORDERS.includes(sortByOrder ?? '')
    ? sortByOrder!
    : 'desc';

  // 点検区分が設定されている場合は、クエリパラメータに追加
  if (inspectionType) {
    query += ` AND i.inspection_type = $${queryParams.length + 1}`;
    queryParams.push(inspectionType);
  }

  query += `
  GROUP BY 
    ir.equipment_id, 
    ir.equipment_serial_number,
    el.equipment_name,
    el.equipment_model,
    el.equipment_manufacturer,
    ir.inspection_date,
    ir.user_id,
    u.user_name,
    i.inspection_type
  ORDER BY 
    ${sortByKey} ${sortOrderValue}
  LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
`;

  queryParams.push(itemsPerPage, (page - 1) * itemsPerPage);

  try {
    const result = await pool.query(query, queryParams);

    const formattedResults = result.rows.map((row) => {
      let inspectionDate;
      if (row.inspection_date == null) {
        inspectionDate = null;
      } else if (typeof row.inspection_date === 'string') {
        inspectionDate = !isNaN(Date.parse(row.inspection_date))
          ? row.inspection_date
          : null;
      } else if (row.inspection_date instanceof Date) {
        inspectionDate = row.inspection_date.toISOString();
      } else {
        inspectionDate = null;
      }
      return {
        ...row,
        inspection_date: inspectionDate
          ? format(parseISO(inspectionDate), 'yyyy-MM-dd')
          : null,
      };
    });

    let totalQuery = `
        SELECT COUNT(*)
        FROM (
          SELECT 
            DISTINCT ir.equipment_id, 
            ir.equipment_serial_number, 
            ir.inspection_date,
            ir.user_id
          FROM 
            inspection_results ir
          JOIN 
            inspection_items i ON ir.inspection_item_id = i.inspection_item_id
          JOIN
            equipment_ledger el ON ir.equipment_id = el.equipment_id
            AND ir.equipment_serial_number = el.equipment_serial_number
          WHERE 
            ir.facility_code = $1
        `;

    let totalParams = [facilityCode];

    // totalQueryにフィルタ条件と検索条件を追加
    ({ query: totalQuery, params: totalParams } = addFilterConditions(
      totalQuery,
      totalParams,
      validFilterCriteria,
    ));

    // 点検区分が設定されている場合は、クエリパラメータに追加
    if (inspectionType) {
      totalQuery += ` AND i.inspection_type = $${totalParams.length + 1}`;
      totalParams.push(inspectionType);
    }

    totalQuery += `) AS subquery`;
    const totalResult = await pool.query(totalQuery, totalParams);

    return {
      items: formattedResults,
      total: totalResult.rows[0].count,
    };
  } catch (error) {
    console.error('[inspection-history] Error executing query:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'データの取得に失敗しました。' },
    });
  }
});
