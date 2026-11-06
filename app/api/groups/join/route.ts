import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { mutateLocalDatabase } from "@/lib/local/store";
import type { GroupMember } from "@/lib/types";
import { joinGroupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = requireUser(await getSessionUser());
    const body = await request.json().catch(() => null);
    const parsed = joinGroupSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Enlace inválido.",
        422,
      );
    }

    const result = await mutateLocalDatabase((database) => {
      const group = database.groups.find(
        (candidate) => candidate.invite_code === parsed.data.code,
      );

      if (!group) {
        throw new LocalApiError(
          "Esta invitación no existe o ya no está disponible.",
          404,
        );
      }

      const existingMember = database.group_members.find(
        (member) =>
          member.group_id === group.id && member.user_id === user.id,
      );

      if (existingMember) {
        return { groupId: group.id, alreadyMember: true };
      }

      if (group.status === "completed") {
        throw new LocalApiError(
          "El sorteo de esta sala ya se realizó y las inscripciones están cerradas.",
          409,
        );
      }

      const memberCount = database.group_members.filter(
        (member) => member.group_id === group.id,
      ).length;

      if (memberCount >= group.max_participants) {
        throw new LocalApiError(
          "Esta sala ya está llena. Pide al organizador ampliar el cupo.",
          409,
        );
      }

      const member: GroupMember = {
        id: `member_${randomUUID()}`,
        group_id: group.id,
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        joined_at: new Date().toISOString(),
      };

      database.group_members.push(member);

      return { groupId: group.id, alreadyMember: false };
    });

    return NextResponse.json(result);
  } catch (error) {
    return localErrorResponse(error);
  }
}
