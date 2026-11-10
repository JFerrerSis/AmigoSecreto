import { NextResponse } from "next/server";

import {
  createGroupWithOwner,
  listGroupsForUser,
} from "@/lib/db/groups";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { createGroupSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = requireUser(await getSessionUser());
    const groups = await listGroupsForUser(user.id);

    return NextResponse.json({ groups });
  } catch (error) {
    return localErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
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
