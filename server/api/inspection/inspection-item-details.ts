import pool from '~/server/config/db';

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
      `[inspection-item-details] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const { inspectionItemIds } = await readBody(event);

  if (!inspectionItemIds) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '点検項目のIDが必要です' },
    });
  }

  let result;
  const query = `
      SELECT 
        inspection_item_id,
        inspection_item,
        inspection_item_description,
        inspection_item_category,
        inspection_sort_number,
        suffix
      FROM 
        inspection_items
      WHERE 
        inspection_item_id = ANY($1) 
        AND facility_code = $2;
    `;
  const values = [inspectionItemIds, facilityCode];

  try {
    result = await pool.query(query, values);
  } catch (error) {
    console.error(
      '[inspection-item-details] Error occurred while fetching inspection item details:',
      error,
    );
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '点検項目の詳細の取得中にエラーが発生しました。' },
    });
  }

  if (result.rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '該当するデータが見つかりませんでした。' },
    });
  }

  return result.rows;
});
