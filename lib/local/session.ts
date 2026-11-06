import "server-only";

import { cookies } from "next/headers";

import { readLocalDatabase } from "@/lib/local/store";
import type { LocalUser } from "@/lib/types";

export const SESSION_COOKIE = "amigo_secreto_user";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getSessionUser(): Promise<LocalUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!userId) return null;

  return readLocalDatabase(
    (database) =>
      database.users.find((user) => user.id === userId) ?? null,
  );
}

export async function setSessionUser(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
    secure: process.env.COOKIE_SECURE === "true",
  });
}

export async function clearSessionUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
