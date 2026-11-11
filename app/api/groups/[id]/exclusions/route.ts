import { NextResponse } from "next/server";
import { z } from "zod";

import { createExclusion, deleteExclusion } from "@/lib/db/groups";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";

const createSchema = z
  .object({
    userA: z.string().uuid(),
    userB: z.string().uuid(),
  })
  .strict();

const deleteSchema = z
  .object({
    exclusionId: z.string().uuid(),
  })
  .strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "exclusion-create",
      limit: 60,
      windowMs: 10 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError("Selecciona dos participantes válidos.", 422);
    }

    const [userA, userB] = [parsed.data.userA, parsed.data.userB].sort();

    if (userA === userB) {
      throw new LocalApiError("Elige dos personas distintas.", 422);
    }

    const exclusion = await createExclusion(id, userA, userB, user.id);

    return NextResponse.json({ exclusion }, { status: 201 });
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
      scope: "exclusion-delete",
      limit: 60,
      windowMs: 10 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError("No pudimos identificar la regla.", 422);
    }

    await deleteExclusion(id, parsed.data.exclusionId, user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return localErrorResponse(error);
  }
}
