import { NextResponse } from "next/server";

import { pingDatabase } from "@/lib/db/pool";
import { getSupabaseServerConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
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

  return NextResponse.json({
    status: database === "ok" ? "ok" : "degraded",
    service: "amigo-secreto",
    database,
    databaseConfigured,
    databaseErrorCode,
    supabase: {
      urlConfigured: Boolean(supabase?.url),
      serviceRoleConfigured: Boolean(supabase?.serviceRoleKey),
    },
    timestamp: new Date().toISOString(),
  });
}
