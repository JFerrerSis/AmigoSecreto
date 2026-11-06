import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import {
  mutateLocalDatabase,
  readLocalDatabase,
} from "@/lib/local/store";
import { generateInviteCode } from "@/lib/invite-code";
import type {
  Group,
  GroupMember,
  GroupWithCount,
  LocalDatabase,
} from "@/lib/types";
import { createGroupSchema } from "@/lib/validation";

function uniqueInviteCode(database: LocalDatabase) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateInviteCode();
    if (!database.groups.some((group) => group.invite_code === code)) {
      return code;
    }
  }

  throw new LocalApiError(
    "No pudimos generar un link de invitación. Inténtalo de nuevo.",
    500,
  );
}

export async function GET() {
  try {
    const user = requireUser(await getSessionUser());

    const groups = await readLocalDatabase((database) => {
      const memberGroupIds = new Set(
        database.group_members
          .filter((member) => member.user_id === user.id)
          .map((member) => member.group_id),
      );

      return database.groups
        .filter((group) => memberGroupIds.has(group.id))
        .sort(
          (left, right) =>
            new Date(right.created_at).getTime() -
            new Date(left.created_at).getTime(),
        )
        .map<GroupWithCount>((group) => ({
          ...group,
          group_members: [
            {
              count: database.group_members.filter(
                (member) => member.group_id === group.id,
              ).length,
            },
          ],
        }));
    });

    return NextResponse.json({ groups });
  } catch (error) {
    return localErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireUser(await getSessionUser());
    const body = await request.json().catch(() => null);
    const parsed = createGroupSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Datos inválidos.",
        422,
      );
    }

    const data = parsed.data;
    const createdAt = new Date().toISOString();

    const group = await mutateLocalDatabase((database) => {
      const created: Group = {
        id: `group_${randomUUID()}`,
        invite_code: uniqueInviteCode(database),
        name: data.name,
        creator_id: user.id,
        min_budget: data.minBudget,
        max_budget: data.maxBudget,
        currency: data.currency,
        max_participants: data.maxParticipants,
        draw_at: data.drawAt,
        send_emails: data.sendEmails,
        status: "pending",
        created_at: createdAt,
        completed_at: null,
      };

      const member: GroupMember = {
        id: `member_${randomUUID()}`,
        group_id: created.id,
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        joined_at: createdAt,
      };

      database.groups.push(created);
      database.group_members.push(member);

      return created;
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    return localErrorResponse(error);
  }
}
