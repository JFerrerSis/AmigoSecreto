import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateLocalUser } from "@/lib/db/users";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse } from "@/lib/local/responses";
import {
  clearSessionUser,
  getSessionUser,
  setSessionUser,
} from "@/lib/local/session";

const sessionSchema = z
  .object({
    intent: z.enum(["login", "create"]).default("create"),
    fullName: z
      .string()
      .trim()
      .max(80, "El nombre es demasiado largo.")
      .optional(),
    email: z
      .string()
      .trim()
      .email("Escribe un correo válido.")
      .max(160, "El correo es demasiado largo."),
  })
  .superRefine((data, context) => {
    if (data.intent === "create" && (!data.fullName || data.fullName.length < 2)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fullName"],
        message: "Escribe tu nombre.",
      });
    }
  });

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch (error) {
    return localErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = sessionSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Datos inválidos.",
        422,
      );
    }

    const result = await authenticateLocalUser({
      intent: parsed.data.intent,
      fullName: parsed.data.fullName?.trim(),
      email: parsed.data.email.toLowerCase(),
    });

    await setSessionUser(result.user.id);

    return NextResponse.json(result);
  } catch (error) {
    return localErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    await clearSessionUser();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return localErrorResponse(error);
  }
}
