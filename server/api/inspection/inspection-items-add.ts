import pool from '~/server/config/db';
import { generateInspectionItemId } from '~/utils/generateInspectionItemId';

interface InspectionItemsRequestBody {
  inspection_type: string;
  inspection_item_category: string;
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
      `[inspection-items-add] Facility code not found for user_id: ${authenticatedUser.user_id}`,
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
    inspection_type,
    inspection_item_category,
    inspection_item,
    inspection_item_description,
    inspection_component_type,
    equipment_type,
    equipment_model,
    min,
    max,
    suffix,
    lowerlimit,
    upperlimit,
  } = await readBody<InspectionItemsRequestBody>(event);

  if (
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

  try {
    const sortNumberResult = await pool.query(
      `SELECT MAX(inspection_sort_number) AS max_sort_number 
       FROM inspection_items 
       WHERE inspection_item_category = $1 AND equipment_model = $2 AND facility_code = $3`,
      [inspection_item_category, equipment_model, facilityCode],
    );

    const maxSortNumber = sortNumberResult.rows[0].max_sort_number || 0;
    const newSortNumber = maxSortNumber + 1;

    const inspection_item_id = generateInspectionItemId(facilityCode);

    const result = await pool.query(
      `INSERT INTO inspection_items 
      (inspection_item_id, inspection_type, inspection_item_category, inspection_item, inspection_item_description, inspection_component_type, facility_code, equipment_type, equipment_model, inspection_sort_number, min, max, suffix, lowerlimit, upperlimit) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        inspection_item_id,
        inspection_type,
        inspection_item_category,
        inspection_item,
        inspection_item_description,
        inspection_component_type,
        facilityCode,
        equipment_type,
        equipment_model,
        newSortNumber,
        min,
        max,
        suffix,
        lowerlimit,
        upperlimit,
      ],
    );

    return result.rows[0];
  } catch (error) {
    console.error(
      '[inspection-items-add]Error occurred while adding inspection item.',
      error,
    );
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '点検項目の保存中にエラーが発生しました。' },
    });
  }
});
