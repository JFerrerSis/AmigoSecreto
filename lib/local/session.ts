import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { getUserById } from "@/lib/db/users";
import type { LocalUser } from "@/lib/types";

export const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-amigo_secreto_user"
    : "amigo_secreto_user";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const DEV_SESSION_SECRET = "dev-only-session-secret-change-me-32chars";

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();

  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Falta SESSION_SECRET. Configura un secreto de al menos 32 caracteres.",
    );
  }

  return DEV_SESSION_SECRET;
}

function signSession(userId: string) {
  return createHmac("sha256", getSessionSecret())
    .update(userId)
    .digest("base64url");
}

function createSessionValue(userId: string) {
  return `${userId}.${signSession(userId)}`;
}

function parseSessionValue(value: string) {
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;

  const userId = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = signSession(userId);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return null;
  }

  return userId;
}

export async function getSessionUser(): Promise<LocalUser | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(SESSION_COOKIE)?.value;

  if (!rawValue) return null;

  const userId = parseSessionValue(rawValue);

  if (!userId) return null;

  return getUserById(userId);
}

export async function setSessionUser(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, createSessionValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.COOKIE_SECURE === "true",
    priority: "high",
  });
}

export async function clearSessionUser() {
  const cookieStore = await cookies();
  cookieStore.delete("amigo_secreto_user");
  cookieStore.delete("__Host-amigo_secreto_user");
}
