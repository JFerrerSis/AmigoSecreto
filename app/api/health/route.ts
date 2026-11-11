import { NextResponse } from "next/server";

import { pingDatabase } from "@/lib/db/pool";
import { localErrorResponse } from "@/lib/local/responses";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { getSupabaseServerConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    enforceRateLimit(request, {
      scope: "health",
      limit: 60,
      windowMs: 60_000,
    });
  } catch (error) {
    return localErrorResponse(error);
  }

  let database: "ok" | "error" = "ok";
  let databaseErrorCode: string | null = null;

  try {
    await pingDatabase();
  } catch (error) {
    console.error("health database error", error);
    database = "error";
    databaseErrorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : error instanceof Error
          ? error.name
          : "UNKNOWN";
  }

  const supabase = getSupabaseServerConfig();
  const databaseConfigured = Boolean(
    process.env.DATABASE_URL?.trim() ||
      process.env.POSTGRES_URL?.trim() ||
      process.env.DIRECT_URL?.trim(),
  );

  const healthToken = process.env.HEALTH_CHECK_TOKEN?.trim();
  const includeDetails =
    process.env.NODE_ENV !== "production" ||
    Boolean(healthToken && request.headers.get("x-health-token") === healthToken);

  const payload = {
    status: database === "ok" ? "ok" : "degraded",
    service: "amigo-secreto",
    timestamp: new Date().toISOString(),
    ...(includeDetails
      ? {
          database,
          databaseConfigured,
          databaseErrorCode,
          supabase: {
            urlConfigured: Boolean(supabase?.url),
            serviceRoleConfigured: Boolean(supabase?.serviceRoleKey),
          },
        }
      : {}),
  };

  return NextResponse.json(payload);
}
