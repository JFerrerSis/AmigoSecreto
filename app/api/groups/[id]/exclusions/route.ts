import { NextResponse } from "next/server";
import { z } from "zod";

import { createExclusion, deleteExclusion } from "@/lib/db/groups";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";

const createSchema = z.object({
  userA: z.string().min(1),
  userB: z.string().min(1),
});

const deleteSchema = z.object({
  exclusionId: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireUser(await getSessionUser());
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError("Selecciona dos participantes.", 422);
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
