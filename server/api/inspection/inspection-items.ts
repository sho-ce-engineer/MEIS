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
      `[inspection-items] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const { equipmentModel, inspectionType } = await readBody<{
    equipmentModel: string;
    inspectionType: string;
  }>(event);
  if (!equipmentModel || !inspectionType) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '機器種別と点検種別は必須です。' },
    });
  }

  const query = `
    SELECT
      inspection_type,
      inspection_item_id,
      inspection_item_category,
      inspection_item,
      inspection_item_description,
      inspection_component_type,
      suffix,
      min,
      max,
      lowerlimit,
      upperlimit,
      inspection_sort_number
    FROM inspection_items 
    WHERE equipment_model = $1 
    AND inspection_type = $2
    AND facility_code = $3
    ORDER BY 
      CASE 
        WHEN inspection_item_category = '外装点検' THEN 1
        WHEN inspection_item_category = '機能点検' THEN 2
        WHEN inspection_item_category = '実測点検' THEN 3
        WHEN inspection_item_category = '警報点検' THEN 4
        ELSE 5 
      END,
      inspection_sort_number ASC`;
  const values = [equipmentModel, inspectionType, facilityCode];

  let result;

  try {
    result = await pool.query(query, values);
  } catch (error) {
    console.error('[inspection-items]Database query error for', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '点検項目の取得中にエラーが発生しました。' },
    });
  }
  if (result.rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '点検項目が見つかりません。' },
    });
  }

  return result.rows;
});
