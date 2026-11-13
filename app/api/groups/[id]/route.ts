import { NextResponse } from "next/server";

import {
  deleteGroup,
  getGroupDataForUser,
  updateGroup,
} from "@/lib/db/groups";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";
import { updateGroupSchema } from "@/lib/validation";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "group-update",
      limit: 30,
      windowMs: 10 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateGroupSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Datos inválidos.",
        422,
      );
    }

    const group = await updateGroup(id, user.id, parsed.data);

    return NextResponse.json({ group });
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
