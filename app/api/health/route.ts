import { NextResponse } from "next/server";

import { pingDatabase } from "@/lib/db/pool";
import { getSupabaseServerConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let database: "ok" | "error" = "ok";

  try {
    await pingDatabase();
  } catch (error) {
    console.error("health database error", error);
    database = "error";
  }

  const supabase = getSupabaseServerConfig();

  return NextResponse.json({
    status: database === "ok" ? "ok" : "degraded",
    service: "amigo-secreto",
    database,
    supabase: {
      urlConfigured: Boolean(supabase?.url),
      serviceRoleConfigured: Boolean(supabase?.serviceRoleKey),
    },
    timestamp: new Date().toISOString(),
  });
}
