import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateLocalUser, updateUserName } from "@/lib/db/users";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import {
  clearSessionUser,
  getSessionUser,
  setSessionUser,
} from "@/lib/local/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";
import { sessionSchema } from "@/lib/validation";

const profileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Escribe tu nombre.")
      .max(80, "El nombre es demasiado largo.")
      .regex(
        /^[^\u0000-\u001F\u007F]*$/,
        "El nombre contiene caracteres no válidos.",
      ),
  })
  .strict();

export async function GET(request: Request) {
  try {
    enforceRateLimit(request, {
      scope: "session-read",
      limit: 120,
      windowMs: 60_000,
    });

    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch (error) {
    return localErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "session",
      limit: 20,
      windowMs: 10 * 60_000,
    });

    const body = await request.json().catch(() => null);
    const parsed = sessionSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Datos inválidos.",
        422,
      );
    }

    enforceRateLimit(request, {
      scope: "session-email",
      limit: 10,
      windowMs: 10 * 60_000,
      key: parsed.data.email.toLowerCase(),
    });

    const result = await authenticateLocalUser({
      intent: parsed.data.intent,
      fullName: parsed.data.fullName?.trim(),
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
    });

    await setSessionUser(result.user.id);

    return NextResponse.json(result);
  } catch (error) {
    return localErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "session-update",
      limit: 20,
      windowMs: 10 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const body = await request.json().catch(() => null);
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Datos inválidos.",
        422,
      );
    }

    const updated = await updateUserName(user.id, parsed.data.fullName);

    return NextResponse.json({ user: updated });
  } catch (error) {
    return localErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "session-delete",
      limit: 30,
      windowMs: 10 * 60_000,
    });

    await clearSessionUser();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return localErrorResponse(error);
  }
}
