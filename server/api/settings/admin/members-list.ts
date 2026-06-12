import pool from '~/server/config/db';

interface membersListRequestBody {
  page?: number;
  itemsPerPage?: number;
  sortRow?: string;
  sortByOrder?: string;
}

export default defineEventHandler(async (event) => {
  // 認証ユーザーの取得
  const authenticatedUser = getAuthenticatedUser(event);

  // 認証ユーザーの施設コードおよびユーザー権限を取得
  const authenticatedUserQuery = `
    SELECT
      facility_code,
      user_role
    FROM users
    WHERE user_id = $1
  `;

  const AuthenticatedUserFacilityResult = await pool.query(
    authenticatedUserQuery,
    [authenticatedUser.user_id],
  );
  if (AuthenticatedUserFacilityResult.rowCount === 0) {
    console.error(
      `[members-list] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const userRole: string = AuthenticatedUserFacilityResult.rows[0].user_role;

  if (userRole !== 'admin') {
    throw createError({
      statusCode: 403,
      statusText: 'Forbidden',
      data: { message: 'アクセス権限がありません。' },
    });
  }

  const {
    page = 1,
    itemsPerPage = 10,
    sortRow = 'user_name',
    sortByOrder = 'asc',
  } = await readBody<membersListRequestBody>(event);

  let query = `
    SELECT
      user_id,
      user_name,
      user_role
    FROM users
    WHERE facility_code = $1
    `;

  const queryParams: any = [facilityCode];

  // ソートに使用できるキーと順序のリスト
  const ALLOWED_SORT_KEYS = ['user_name', 'user_role'];
  const ALLOWED_SORT_ORDERS = ['asc', 'desc'];

  // ソート条件と順序を設定
  const sortByKey = ALLOWED_SORT_KEYS.includes(sortRow ?? '')
    ? sortRow!
    : 'user_name';
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

    // ユーザーの合計数を取得
    const totalQuery = `SELECT COUNT(*) FROM users WHERE facility_code = $1`;
    const totalResult = await pool.query(totalQuery, [facilityCode]);

    return {
      items: result.rows,
      total: parseInt(totalResult.rows[0].count, 10),
    };
  } catch (error) {
    console.error('[members-list] Error executing query:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'データの取得に失敗しました。' },
    });
  }
});
