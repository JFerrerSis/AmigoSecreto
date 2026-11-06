import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse } from "@/lib/local/responses";
import {
  clearSessionUser,
  getSessionUser,
  setSessionUser,
} from "@/lib/local/session";
import { mutateLocalDatabase } from "@/lib/local/store";
import type { LocalUser } from "@/lib/types";

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

    const { intent } = parsed.data;
    const fullName = parsed.data.fullName?.trim();
    const email = parsed.data.email.toLowerCase();

    const result = await mutateLocalDatabase((database) => {
      const existing = database.users.find(
        (candidate) => candidate.email?.toLowerCase() === email,
      );

      if (intent === "login") {
        if (!existing) {
          throw new LocalApiError(
            "No encontramos una identidad con ese correo. Crea una nueva.",
            404,
            "USER_NOT_FOUND",
          );
        }

        return { user: existing, existing: true };
      }

      if (existing) {
        if (fullName) existing.full_name = fullName;
        return { user: existing, existing: true };
      }

      const created: LocalUser = {
        id: `user_${randomUUID()}`,
        full_name: fullName ?? "Invitado",
        email,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };

      database.users.push(created);
      return { user: created, existing: false };
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
