import pool from '~/server/config/db';
import { sendNoContent } from 'h3';

interface SaveInspectionResultRequestBody {
  results: {
    result_id: string;
    user_id: string;
    inspection_item_id: string;
    equipment_id: string;
    equipment_serial_number: string;
    result: string | number;
    notes?: string;
    inspection_date: string | Date; //日付処理の見直しが完了したらどちらかの方に統一
  }[];
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
      `[inspection-items-save-result] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const { results } = await readBody<SaveInspectionResultRequestBody>(event);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of results) {
      const {
        result_id,
        user_id,
        inspection_item_id,
        equipment_id,
        equipment_serial_number,
        result,
        notes,
        inspection_date,
      } = item;

      if (
        !result_id ||
        !user_id ||
        !inspection_item_id ||
        !equipment_id ||
        !equipment_serial_number ||
        result === undefined ||
        !inspection_date
      ) {
        throw createError({
          statusCode: 400,
          statusText: 'Bad Request',
          data: { message: '必要なフィールドが不足しています。' },
        });
      }

      //日付処理の見直しが完了したら削除
      const formattedDate =
        typeof inspection_date === 'string'
          ? inspection_date
          : inspection_date.toISOString();

      const query = `
      INSERT INTO inspection_results (
        result_id,
        facility_code,
        user_id,
        inspection_item_id,
        equipment_id,
        equipment_serial_number,
        result,
        inspection_date,
        result_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

      const values = [
        result_id,
        facilityCode,
        user_id,
        inspection_item_id,
        equipment_id,
        equipment_serial_number,
        result,
        formattedDate,
        notes,
      ];

      await client.query(query, values);
    }
    await client.query('COMMIT');
    return sendNoContent(event);
  } catch (error) {
    console.error('[inspection-items-save-result] Transaction failed:', error);
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});
