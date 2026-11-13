import { NextResponse } from "next/server";

import { unblockGroupMember } from "@/lib/db/groups";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "group-member-unblock",
      limit: 60,
      windowMs: 60 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const { id, userId } = await params;

    await unblockGroupMember(id, userId, user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return localErrorResponse(error);
  }
}
