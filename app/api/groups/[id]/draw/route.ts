import { NextResponse } from "next/server";

import { runGroupDraw } from "@/lib/db/groups";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "group-draw",
      limit: 10,
      windowMs: 10 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const { id } = await params;

    const result = await runGroupDraw(id, user.id);

    return NextResponse.json({
      ok: true,
      pairsCreated: result.pairsCreated,
    });
  } catch (error) {
    return localErrorResponse(error);
  }
}
