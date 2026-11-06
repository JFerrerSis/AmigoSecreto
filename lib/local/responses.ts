import { NextResponse } from "next/server";

import { LocalApiError } from "@/lib/local/errors";

export function localErrorResponse(error: unknown) {
  if (error instanceof LocalApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  console.error("local api error", error);

  return NextResponse.json(
    { error: "Ocurrió un error inesperado. Inténtalo de nuevo." },
    { status: 500 },
  );
}

export function requireUser<T>(user: T | null): T {
  if (!user) {
    throw new LocalApiError(
      "Debes crear tu identidad local para continuar.",
      401,
      "NO_SESSION",
    );
  }

  return user;
}
