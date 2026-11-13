import { NextResponse } from "next/server";

import { removeGroupMember } from "@/lib/db/groups";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";
import { removeMemberSchema } from "@/lib/validation";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "group-member-remove",
      limit: 60,
      windowMs: 60 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const { id, userId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = removeMemberSchema.safeParse(body ?? {});

    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Datos inválidos.",
        422,
      );
    }

    await removeGroupMember(id, userId, user.id, parsed.data.block);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return localErrorResponse(error);
  }
}
