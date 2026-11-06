import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { mutateLocalDatabase } from "@/lib/local/store";
import type { Exclusion, LocalDatabase } from "@/lib/types";

const createSchema = z.object({
  userA: z.string().min(1),
  userB: z.string().min(1),
});

const deleteSchema = z.object({
  exclusionId: z.string().min(1),
});

function assertEditableGroup(
  database: LocalDatabase,
  groupId: string,
  userId: string,
) {
  const group = database.groups.find((candidate) => candidate.id === groupId);

  if (!group) {
    throw new LocalApiError("Esta sala no existe.", 404);
  }

  if (group.creator_id !== userId) {
    throw new LocalApiError(
      "Solo el organizador puede editar las exclusiones.",
      403,
    );
  }

  if (group.status === "completed") {
    throw new LocalApiError(
      "El sorteo ya se realizó; no puedes cambiar las exclusiones.",
      409,
    );
  }

  return group;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireUser(await getSessionUser());
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError("Selecciona dos participantes.", 422);
    }

    const [userA, userB] = [parsed.data.userA, parsed.data.userB].sort();

    if (userA === userB) {
      throw new LocalApiError("Elige dos personas distintas.", 422);
    }

    const exclusion = await mutateLocalDatabase((database) => {
      const group = assertEditableGroup(database, id, user.id);
      const memberIds = new Set(
        database.group_members
          .filter((member) => member.group_id === group.id)
          .map((member) => member.user_id),
      );

      if (!memberIds.has(userA) || !memberIds.has(userB)) {
        throw new LocalApiError(
          "Los dos participantes deben pertenecer a la sala.",
          422,
        );
      }

      const duplicate = database.exclusions.some(
        (candidate) =>
          candidate.group_id === group.id &&
          ((candidate.user_id_1 === userA &&
            candidate.user_id_2 === userB) ||
            (candidate.user_id_1 === userB &&
              candidate.user_id_2 === userA)),
      );

      if (duplicate) {
        throw new LocalApiError("Esa pareja ya está bloqueada.", 409);
      }

      const created: Exclusion = {
        id: `exclusion_${randomUUID()}`,
        group_id: group.id,
        user_id_1: userA,
        user_id_2: userB,
        created_at: new Date().toISOString(),
      };

      database.exclusions.push(created);
      return created;
    });

    return NextResponse.json({ exclusion }, { status: 201 });
  } catch (error) {
    return localErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireUser(await getSessionUser());
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError("No pudimos identificar la regla.", 422);
    }

    await mutateLocalDatabase((database) => {
      const group = assertEditableGroup(database, id, user.id);
      const index = database.exclusions.findIndex(
        (exclusion) =>
          exclusion.id === parsed.data.exclusionId &&
          exclusion.group_id === group.id,
      );

      if (index === -1) {
        throw new LocalApiError("Esa regla ya no existe.", 404);
      }

      database.exclusions.splice(index, 1);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return localErrorResponse(error);
  }
}
