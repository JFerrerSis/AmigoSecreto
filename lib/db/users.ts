import "server-only";

import { isUniqueViolation, isUuid, query } from "@/lib/db/pool";
import { LocalApiError } from "@/lib/local/errors";
import type { LocalUser } from "@/lib/types";

const USER_COLUMNS = "id, full_name, email, avatar_url, created_at";

export interface SessionUserInput {
  intent: "login" | "create";
  fullName?: string;
  email: string;
}

export interface SessionUserResult {
  user: LocalUser;
  existing: boolean;
}

export async function getUserById(id: string): Promise<LocalUser | null> {
  if (!isUuid(id)) return null;

  const result = await query<LocalUser>(
    `select ${USER_COLUMNS} from public.users where id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function findUserByEmail(
  email: string,
): Promise<LocalUser | null> {
  const result = await query<LocalUser>(
    `select ${USER_COLUMNS} from public.users where email = $1`,
    [email.trim().toLowerCase()],
  );

  return result.rows[0] ?? null;
}

export async function authenticateLocalUser(
  input: SessionUserInput,
): Promise<SessionUserResult> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName?.trim();

  const existing = await findUserByEmail(email);

  if (input.intent === "login") {
    if (!existing) {
      throw new LocalApiError(
        "No encontramos una cuenta con ese correo. Crea una nueva.",
        404,
        "USER_NOT_FOUND",
      );
    }

    return { user: existing, existing: true };
  }

  if (existing) {
    if (fullName && fullName !== existing.full_name) {
      const updated = await query<LocalUser>(
        `update public.users
            set full_name = $2
          where id = $1
        returning ${USER_COLUMNS}`,
        [existing.id, fullName],
      );

      return { user: updated.rows[0] ?? existing, existing: true };
    }

    return { user: existing, existing: true };
  }

  try {
    const created = await query<LocalUser>(
      `insert into public.users (full_name, email, avatar_url)
       values ($1, $2, null)
       returning ${USER_COLUMNS}`,
      [fullName ?? "Invitado", email],
    );

    return { user: created.rows[0], existing: false };
  } catch (error) {
    if (isUniqueViolation(error)) {
      const raced = await findUserByEmail(email);
      if (raced) return { user: raced, existing: true };
    }

    throw error;
  }
}
