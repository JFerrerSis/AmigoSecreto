import { NextResponse } from "next/server";

import { deleteGroup, getGroupDataForUser } from "@/lib/db/groups";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    enforceRateLimit(request, {
      scope: "group-read",
      limit: 120,
      windowMs: 60_000,
    });

    const user = requireUser(await getSessionUser());
    const { id } = await params;

    const data = await getGroupDataForUser(id, user.id);

    return NextResponse.json(data);
  } catch (error) {
    return localErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "group-delete",
      limit: 20,
      windowMs: 60 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const { id } = await params;

    await deleteGroup(id, user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return localErrorResponse(error);
  }
}
