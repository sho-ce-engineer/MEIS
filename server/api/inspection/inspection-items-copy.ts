import pool from '~/server/config/db';
import { generateInspectionItemId } from '~/utils/generateInspectionItemId';

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
      `[inspection-items-copy] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const { baseInspectionData, targetInspectionData } = await readBody(event);

  if (
    !baseInspectionData.baseEquipmentType ||
    !baseInspectionData.baseEquipmentModel ||
    !baseInspectionData.baseInspectionType ||
    !targetInspectionData.targetEquipmentType ||
    !targetInspectionData.targetEquipmentModel ||
    !targetInspectionData.targetInspectionType
  ) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '必須項目が不足しています。' },
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const getBaseInspectionData = await client.query(
      `SELECT
          inspection_item_category,
          inspection_item,
          inspection_item_description,
          inspection_component_type,
          inspection_sort_number,
          min,
          max,
          suffix,
          lowerlimit,
          upperlimit
        FROM inspection_items
        WHERE facility_code = $1
        AND equipment_type = $2
        AND equipment_model = $3
        AND inspection_type = $4
        `,
      [
        facilityCode,
        baseInspectionData.baseEquipmentType,
        baseInspectionData.baseEquipmentModel,
        baseInspectionData.baseInspectionType,
      ],
    );

    for (const row of getBaseInspectionData.rows) {
      await client.query(
        `INSERT INTO inspection_items
        (inspection_item_id, inspection_type, inspection_item_category, inspection_item, inspection_item_description, inspection_component_type, facility_code, equipment_type, equipment_model, inspection_sort_number, min, max, suffix, lowerLimit, upperLimit)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          generateInspectionItemId(facilityCode),
          targetInspectionData.targetInspectionType,
          row.inspection_item_category,
          row.inspection_item,
          row.inspection_item_description,
          row.inspection_component_type,
          facilityCode,
          targetInspectionData.targetEquipmentType,
          targetInspectionData.targetEquipmentModel,
          row.inspection_sort_number,
          row.min,
          row.max,
          row.suffix,
          row.lowerlimit,
          row.upperlimit,
        ],
      );
    }

    await client.query('COMMIT');
    return sendNoContent(event);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[inspection-items-copy] Transaction failed:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '点検項目のコピー中にエラーが発生しました。' },
    });
  } finally {
    client.release();
  }
});
