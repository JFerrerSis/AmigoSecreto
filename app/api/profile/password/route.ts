import { NextResponse } from "next/server";

import { changeUserPassword } from "@/lib/db/users";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";
import { passwordChangeSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "password-change",
      limit: 10,
      windowMs: 10 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const body = await request.json().catch(() => null);
    const parsed = passwordChangeSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Datos inválidos.",
        422,
      );
    }

    const updated = await changeUserPassword(
      user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );

    return NextResponse.json({ user: updated });
  } catch (error) {
    return localErrorResponse(error);
  }
}
