import { DrizzleQueryError } from 'drizzle-orm/errors';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import pool from '~/server/config/db';
import * as schema from './schema';

export const db = drizzle(pool, { schema });

export const DatabaseError = pg.DatabaseError;
export { DrizzleQueryError };
