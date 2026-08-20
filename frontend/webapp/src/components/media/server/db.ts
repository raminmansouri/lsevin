import "server-only";

import sharedSql from "@/config/database/db";

/**
 * The media manager used to open a second `postgres()` pool of its own (max 10,
 * on top of the main pool's max 5) and resolved its connection string from
 * POSTGRES_URL / DATABASE_URL / POSTGRES_CONNECTION_STRING — whichever happened
 * to be set first. That is one more place a deployment can end up talking
 * straight to PostgreSQL while everything else goes through PgBouncer, and one
 * more pool competing for the same backend budget.
 *
 * There is one connection pool in this process now, and DATABASE_URL is the only
 * thing that decides where it points.
 */
export const mediaSql = sharedSql;

export type MediaSqlClient = typeof mediaSql;
