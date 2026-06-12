import pool from '~/server/config/db';
import { format, parseISO } from 'date-fns';

interface AnnouncementRequestBody {
  page?: number;
  itemsPerPage?: number;
  sortRow?: string;
  sortByOrder?: string;
}

export default defineEventHandler(async (event) => {
  // 認証ユーザーの取得
  const authenticatedUser = getAuthenticatedUser(event);

  const {
    page = 1,
    itemsPerPage = 10,
    sortRow = 'created_at',
    sortByOrder = 'desc',
  } = await readBody<AnnouncementRequestBody>(event);

  // ソートカラムのバリデーション
  const validSortColumns = ['created_at', 'importance_level', 'title'];
  const sortByKey = validSortColumns.includes(sortRow) ? sortRow : 'created_at';
  const sortOrderValue = sortByOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const query = `
    SELECT a.id, a.title, a.message, a.importance_level, a.is_active, a.created_at, a.audience,
           COALESCE(un.is_viewed, FALSE) AS is_viewed, 
           un.viewed_at
    FROM announcements a
    LEFT JOIN user_notifications un 
      ON a.id = un.announcement_id AND un.user_id = $3
    ORDER BY ${sortByKey} ${sortOrderValue}
    LIMIT $1 OFFSET $2
  `;

  const queryParams = [
    itemsPerPage,
    (page - 1) * itemsPerPage,
    authenticatedUser.user_id,
  ];

  try {
    const result = await pool.query(query, queryParams);
    // 日付を整形
    const formattedCreatedAt = result.rows.map((row) => {
      const createdAtDate =
        typeof row.created_at === 'string'
          ? row.created_at
          : row.created_at.toISOString();
      return {
        ...row,
        created_at: format(parseISO(createdAtDate), 'yyyy-MM-dd'),
      };
    });
    const totalQuery = 'SELECT COUNT(*) FROM announcements';
    const totalResult = await pool.query(totalQuery);
    return {
      items: formattedCreatedAt,
      total: totalResult.rows[0].count,
    };
  } catch (error) {
    console.error('[announcements]Error fetching data:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'データの取得に失敗しました。' },
    });
  }
});
