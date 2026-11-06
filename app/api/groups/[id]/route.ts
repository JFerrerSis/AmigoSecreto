import { NextResponse } from "next/server";

import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { readLocalDatabase } from "@/lib/local/store";
import type { GroupData } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireUser(await getSessionUser());
    const { id } = await params;

    const data = await readLocalDatabase<GroupData>((database) => {
      const group = database.groups.find((candidate) => candidate.id === id);

      if (!group) {
        throw new LocalApiError("Esta sala no existe.", 404);
      }

      const isMember = database.group_members.some(
        (member) =>
          member.group_id === group.id && member.user_id === user.id,
      );

      if (!isMember) {
        throw new LocalApiError(
          "No tienes permiso para ver esta sala. Pide una invitación al organizador.",
          403,
        );
      }

      const members = database.group_members
        .filter((member) => member.group_id === group.id)
        .sort(
          (left, right) =>
            new Date(left.joined_at).getTime() -
            new Date(right.joined_at).getTime(),
        );

      const exclusions = database.exclusions
        .filter((exclusion) => exclusion.group_id === group.id)
        .sort(
          (left, right) =>
            new Date(left.created_at).getTime() -
            new Date(right.created_at).getTime(),
        );

      const drawResult =
        group.status === "completed"
          ? (database.draw_results.find(
              (result) =>
                result.group_id === group.id && result.giver_id === user.id,
            ) ?? null)
          : null;

      return { group, members, exclusions, drawResult };
    });

    return NextResponse.json(data);
  } catch (error) {
    return localErrorResponse(error);
  }
}
