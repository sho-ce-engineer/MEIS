import pool from '~/server/config/db';
import { parseISO, format } from 'date-fns';

interface issuesRequestBody {
  page?: number;
  itemsPerPage?: number;
  sortRow?: string;
  sortByOrder?: string;
  filterCriteria?: Record<string, string>;
}

// フィルタリングに使用できるキーのリスト
const ALLOWED_FILTER_KEYS = ['reported_date', 'equipment_id', 'location'];
const DATE_COLUMNS = ['reported_date'];

const addFilterConditions = (
  query: string,
  params: any[],
  filteredCriteria: Record<string, string>,
): { query: string; params: any[] } => {
  for (const [key, value] of Object.entries(filteredCriteria)) {
    if (!ALLOWED_FILTER_KEYS.includes(key)) continue;
    if (DATE_COLUMNS.includes(key)) {
      query += ` AND ${key}::DATE = $${params.length + 1}`;
      params.push(value);
    } else {
      query += ` AND ${key} ILIKE $${params.length + 1}`;
      params.push(`%${value}%`);
    }
  }
  return { query, params };
};

// ソートに使用できるキーと順序のリスト
const ALLOWED_SORT_KEYS = [
  'reported_date',
  'reporter',
  'equipment_id',
  'location',
  'description',
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
      `[issues-list] Facility code not found for user_id: ${authenticatedUser.user_id}`,
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
    sortRow = 'reported_date',
    sortByOrder = 'desc',
    filterCriteria = {},
  } = await readBody<issuesRequestBody>(event);

  let query = `
    SELECT
      issue_id,
       reported_date,
       reporter,
       equipment_id,
       location,
       description
    FROM issues
    WHERE facility_code = $1
  `;
  let queryParams: any = [facilityCode];

  // フィルター条件から空の値を除外した上で作成
  const filteredCriteria = Object.fromEntries(
    Object.entries(filterCriteria).filter(([_, value]) => value !== ''),
  );

  // メインクエリの作成（フィルタ条件と検索条件を追加）
  ({ query, params: queryParams } = addFilterConditions(
    query,
    queryParams,
    filteredCriteria,
  ));

  // ソート条件と順序を設定
  const sortByKey = ALLOWED_SORT_KEYS.includes(sortRow ?? '')
    ? sortRow!
    : 'reported_date';
  const sortOrderValue = ALLOWED_SORT_ORDERS.includes(sortByOrder ?? '')
    ? sortByOrder!
    : 'desc';

  // 並び順やページネーションを追加
  query += `
    ORDER BY ${sortByKey} ${sortOrderValue}
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
  `;
  queryParams.push(itemsPerPage, (page - 1) * itemsPerPage);

  try {
    const result = await pool.query(query, queryParams);

    // 日付フォーマットの整形
    const formattedReportedDate = result.rows.map((row) => {
      let reportedDate;
      if (row.reported_date == null) {
        reportedDate = null;
      } else if (typeof row.reported_date === 'string') {
        reportedDate = !isNaN(Date.parse(row.reported_date))
          ? row.reported_date
          : null;
      } else if (row.reported_date instanceof Date) {
        reportedDate = row.reported_date.toISOString();
      } else {
        reportedDate = null;
      }

      return {
        ...row,
        reported_date: reportedDate
          ? format(parseISO(reportedDate), 'yyyy-MM-dd')
          : null,
      };
    });

    // データの合計数を取得
    let totalQuery = `SELECT COUNT(*) FROM issues WHERE facility_code = $1`;
    let totalParams = [facilityCode];

    // totalQueryにフィルタ条件と検索条件を追加
    ({ query: totalQuery, params: totalParams } = addFilterConditions(
      totalQuery,
      totalParams,
      filteredCriteria,
    ));

    const totalResult = await pool.query(totalQuery, totalParams);

    return {
      items: formattedReportedDate,
      total: parseInt(totalResult.rows[0].count, 10),
    };
  } catch (error) {
    console.error('[issues-list] Error executing query:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'データの取得に失敗しました。' },
    });
  }
});
