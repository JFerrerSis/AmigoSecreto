import "server-only";

import {
  Pool,
  types,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from "pg";

import { LocalApiError } from "@/lib/local/errors";

types.setTypeParser(types.builtins.TIMESTAMPTZ, (value) =>
  new Date(value).toISOString(),
);
types.setTypeParser(types.builtins.TIMESTAMP, (value) =>
  new Date(`${value}Z`).toISOString(),
);
types.setTypeParser(types.builtins.NUMERIC, (value) => Number(value));

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function connectionString() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.DIRECT_URL?.trim() ||
    null
  );
}

const globalDatabase = globalThis as unknown as {
  amigoSecretoPool?: Pool;
};

export function getPool(): Pool {
  const url = connectionString();

  if (!url) {
    throw new LocalApiError(
      "Falta configurar DATABASE_URL (connection string de Supabase).",
      503,
      "DATABASE_NOT_CONFIGURED",
    );
  }

  if (!globalDatabase.amigoSecretoPool) {
    const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n");
    const ssl =
      process.env.DATABASE_SSL === "false"
        ? false
        : {
            rejectUnauthorized:
              process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true",
            ...(ca ? { ca } : {}),
          };

    globalDatabase.amigoSecretoPool = new Pool({
      connectionString: url,
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl,
      application_name: "amigo-secreto",
    });
  }

  return globalDatabase.amigoSecretoPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values);
}

export async function withTransaction<T>(
  run: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function pingDatabase(): Promise<void> {
  await query("select 1");
}

export function isPgErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === code
  );
}

export function isUniqueViolation(error: unknown): boolean {
  return isPgErrorCode(error, "23505");
}

export function isForeignKeyViolation(error: unknown): boolean {
  return isPgErrorCode(error, "23503");
}

export function isPgRaise(error: unknown, message: string): boolean {
  return (
    isPgErrorCode(error, "P0001") &&
    error instanceof Error &&
    error.message === message
  );
}
