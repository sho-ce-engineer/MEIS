// 点検項目の更新
import pool from '~/server/config/db';

interface InspectionItemsRequestBody {
  inspection_type: string;
  inspection_item_category: string;
  inspection_item_id: string;
  inspection_sort_number: number;
  inspection_item: string;
  inspection_item_description: string;
  inspection_component_type: string;
  equipment_type: string;
  equipment_model: string;
  min?: number;
  max?: number;
  suffix?: string;
  lowerlimit?: number;
  upperlimit?: number;
}

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
      `[inspection-items-update] Facility code not found for user_id: ${authenticatedUser.user_id}`,
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
    inspection_item_id,
    inspection_type,
    inspection_item_category,
    inspection_item,
    inspection_item_description,
    inspection_component_type,
    equipment_type,
    equipment_model,
    inspection_sort_number,
    min,
    max,
    suffix,
    lowerlimit,
    upperlimit,
  } = await readBody<InspectionItemsRequestBody>(event);

  if (
    !inspection_item_id ||
    !inspection_type ||
    !inspection_item_category ||
    !inspection_item ||
    !inspection_component_type ||
    !equipment_type ||
    !equipment_model
  ) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '必須項目が不足しています。' },
    });
  }

  let result;

  try {
    // 点検項目の更新処理
    result = await pool.query(
      `UPDATE inspection_items 
       SET inspection_type = $1,
           inspection_item_category = $2,
           inspection_item = $3,
           inspection_item_description = $4,
           inspection_component_type = $5,
           inspection_sort_number = $6,
           min = $7,
           max = $8,
           suffix = $9,
           lowerlimit = $10,
           upperlimit = $11
       WHERE inspection_item_id = $12
       AND facility_code = $13 
       RETURNING *`,
      [
        inspection_type,
        inspection_item_category,
        inspection_item,
        inspection_item_description,
        inspection_component_type,
        inspection_sort_number,
        min,
        max,
        suffix,
        lowerlimit,
        upperlimit,
        inspection_item_id,
        facilityCode,
      ],
    );
  } catch (error) {
    console.error(
      '[inspection-items-update]Error occurred while updating inspection item.',
      error,
    );
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '点検項目の保存中にエラーが発生しました。' },
    });
  }

  if (result.rowCount === 0) {
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '点検項目が登録されていません。' },
    });
  }
  return result.rows[0];
});
