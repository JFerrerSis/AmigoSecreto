import { NextResponse } from "next/server";

import { joinGroupByCode } from "@/lib/db/groups";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { joinGroupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = requireUser(await getSessionUser());
    const body = await request.json().catch(() => null);
    const parsed = joinGroupSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Enlace inválido.",
        422,
      );
    }

    const result = await joinGroupByCode(parsed.data.code, user);

    return NextResponse.json(result);
  } catch (error) {
    return localErrorResponse(error);
  }
}
