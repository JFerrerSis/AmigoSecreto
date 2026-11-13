import "server-only";

import type { PoolClient } from "pg";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  isUniqueViolation,
  isUuid,
  query,
  withTransaction,
} from "@/lib/db/pool";
import { LocalApiError } from "@/lib/local/errors";
import type { LocalUser } from "@/lib/types";

const USER_SELECT = `
  u.id,
  u.full_name,
  u.email,
  u.avatar_url,
  u.created_at,
  (c.password_hash is not null) as has_password
`;

const USER_FROM = `
  public.users u
  left join public.user_credentials c on c.user_id = u.id
`;

type Queryable = Pick<PoolClient, "query">;

async function loadUserById(
  id: string,
  client?: Queryable,
): Promise<LocalUser | null> {
  const sql = `select ${USER_SELECT} from ${USER_FROM} where u.id = $1`;
  const result = client
    ? await client.query<LocalUser>(sql, [id])
    : await query<LocalUser>(sql, [id]);

  return result.rows[0] ?? null;
}

export interface SessionUserInput {
  intent: "login" | "create" | "set-password";
  fullName?: string;
  email: string;
  password?: string;
}

export interface SessionUserResult {
  user: LocalUser;
  existing: boolean;
}

export async function getUserById(id: string): Promise<LocalUser | null> {
  if (!isUuid(id)) return null;
  return loadUserById(id);
}

export async function findUserByEmail(
  email: string,
): Promise<LocalUser | null> {
  const result = await query<LocalUser>(
    `select ${USER_SELECT} from ${USER_FROM} where u.email = $1`,
    [email.trim().toLowerCase()],
  );

  return result.rows[0] ?? null;
}

async function getPasswordHash(userId: string): Promise<string | null> {
  const result = await query<{ password_hash: string | null }>(
    "select password_hash from public.user_credentials where user_id = $1",
    [userId],
  );

  return result.rows[0]?.password_hash ?? null;
}

function validatePassword(password: string | undefined) {
  if (!password || password.length < 8) {
    throw new LocalApiError(
      "La contraseña debe tener al menos 8 caracteres.",
      422,
      "INVALID_PASSWORD",
    );
  }
}

export async function authenticateLocalUser(
  input: SessionUserInput,
): Promise<SessionUserResult> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName?.trim();
  const password = input.password;

  const existing = await findUserByEmail(email);

  if (input.intent === "login") {
    if (!existing) {
      throw new LocalApiError(
        "No encontramos una cuenta con ese correo. Crea una nueva.",
        404,
        "USER_NOT_FOUND",
      );
    }

    if (!existing.has_password) {
      throw new LocalApiError(
        "Tu cuenta es anterior al acceso con contraseña. Crea una para continuar.",
        409,
        "PASSWORD_SETUP_REQUIRED",
      );
    }

    if (!password) {
      throw new LocalApiError(
        "Escribe tu contraseña.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    const passwordHash = await getPasswordHash(existing.id);

    if (!passwordHash || !(await verifyPassword(password, passwordHash))) {
      throw new LocalApiError(
        "Correo o contraseña incorrectos.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    return { user: existing, existing: true };
  }

  if (input.intent === "set-password") {
    if (!existing) {
      throw new LocalApiError(
        "No encontramos una cuenta con ese correo.",
        404,
        "USER_NOT_FOUND",
      );
    }

    if (existing.has_password) {
      throw new LocalApiError(
        "Esta cuenta ya tiene contraseña. Inicia sesión para cambiarla.",
        409,
        "PASSWORD_ALREADY_SET",
      );
    }

    validatePassword(password);

    const passwordHash = await hashPassword(password!);

    await query(
      `insert into public.user_credentials (user_id, password_hash)
       values ($1, $2)
       on conflict (user_id) do update
         set password_hash = excluded.password_hash,
             updated_at = now()`,
      [existing.id, passwordHash],
    );

    const user = await loadUserById(existing.id);

    if (!user) {
      throw new LocalApiError("No encontramos tu cuenta.", 404);
    }

    return { user, existing: true };
  }

  if (existing) {
    if (existing.has_password) {
      throw new LocalApiError(
        "Ya existe una cuenta con ese correo. Inicia sesión.",
        409,
        "EMAIL_ALREADY_EXISTS",
      );
    }

    throw new LocalApiError(
      "Esta cuenta ya existe. Inicia sesión y crea tu contraseña.",
      409,
      "PASSWORD_SETUP_REQUIRED",
    );
  }

  if (!fullName || fullName.length < 2 || fullName.length > 80) {
    throw new LocalApiError("Escribe un nombre válido.", 422);
  }

  validatePassword(password);

  const passwordHash = await hashPassword(password!);

  try {
    return await withTransaction(async (client) => {
      const created = await client.query<{ id: string }>(
        `insert into public.users (full_name, email, avatar_url)
         values ($1, $2, null)
         returning id`,
        [fullName, email],
      );

      const userId = created.rows[0]?.id;

      if (!userId) {
        throw new LocalApiError("No pudimos crear tu cuenta.", 500);
      }

      await client.query(
        `insert into public.user_credentials (user_id, password_hash)
         values ($1, $2)`,
        [userId, passwordHash],
      );

      const user = await loadUserById(userId, client);

      if (!user) {
        throw new LocalApiError("No pudimos crear tu cuenta.", 500);
      }

      return { user, existing: false };
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new LocalApiError(
        "Ya existe una cuenta con ese correo. Inicia sesión.",
        409,
        "EMAIL_ALREADY_EXISTS",
      );
    }

    throw error;
  }
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string | undefined,
  newPassword: string | undefined,
): Promise<LocalUser> {
  if (!isUuid(userId)) {
    throw new LocalApiError("No encontramos tu cuenta.", 404);
  }

  validatePassword(newPassword);

  const user = await loadUserById(userId);

  if (!user) {
    throw new LocalApiError("No encontramos tu cuenta.", 404);
  }

  const currentHash = await getPasswordHash(userId);

  if (currentHash) {
    if (!currentPassword) {
      throw new LocalApiError(
        "Escribe tu contraseña actual.",
        422,
        "CURRENT_PASSWORD_REQUIRED",
      );
    }

    if (!(await verifyPassword(currentPassword, currentHash))) {
      throw new LocalApiError(
        "La contraseña actual no es correcta.",
        401,
        "INVALID_CREDENTIALS",
      );
    }
  }

  const passwordHash = await hashPassword(newPassword!);

  await query(
    `insert into public.user_credentials (user_id, password_hash)
     values ($1, $2)
     on conflict (user_id) do update
       set password_hash = excluded.password_hash,
           updated_at = now()`,
    [userId, passwordHash],
  );

  const updated = await loadUserById(userId);

  if (!updated) {
    throw new LocalApiError("No encontramos tu cuenta.", 404);
  }

  return updated;
}

export async function updateUserName(
  userId: string,
  fullName: string,
): Promise<LocalUser> {
  if (!isUuid(userId)) {
    throw new LocalApiError("No encontramos tu cuenta.", 404);
  }

  const cleanName = fullName.trim();

  if (cleanName.length < 2 || cleanName.length > 80) {
    throw new LocalApiError("Escribe un nombre válido.", 422);
  }

  return withTransaction(async (client) => {
    const result = await client.query<{ id: string }>(
      `update public.users
          set full_name = $2
        where id = $1
      returning id`,
      [userId, cleanName],
    );

    if (!result.rows[0]) {
      throw new LocalApiError("No encontramos tu cuenta.", 404);
    }

    await client.query(
      `update public.group_members
          set full_name = $2
        where user_id = $1`,
      [userId, cleanName],
    );

    const user = await loadUserById(userId, client);

    if (!user) {
      throw new LocalApiError("No encontramos tu cuenta.", 404);
    }

    return user;
  });
}
