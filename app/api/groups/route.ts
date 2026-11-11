import { NextResponse } from "next/server";

import {
  createGroupWithOwner,
  listGroupsForUser,
} from "@/lib/db/groups";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";
import { createGroupSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    enforceRateLimit(request, {
      scope: "group-list",
      limit: 120,
      windowMs: 60_000,
    });

    const user = requireUser(await getSessionUser());
    const groups = await listGroupsForUser(user.id);

    return NextResponse.json({ groups });
  } catch (error) {
    return localErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "group-create",
      limit: 20,
      windowMs: 60 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const body = await request.json().catch(() => null);
    const parsed = createGroupSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Datos inválidos.",
        422,
      );
    }

    const group = await createGroupWithOwner(user, parsed.data);

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    return localErrorResponse(error);
  }
}
