import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { buildDraw, DrawError, type DrawPair } from "@/lib/draw";
import { sendDrawEmails } from "@/lib/email";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { mutateLocalDatabase } from "@/lib/local/store";
import type { DrawResult, Group, GroupMember } from "@/lib/types";

export const maxDuration = 60;

function getAppUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) return configured.replace(/\/+$/, "");

  return new URL(request.url).origin;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireUser(await getSessionUser());
    const { id } = await params;

    const result = await mutateLocalDatabase((database) => {
      const group = database.groups.find((candidate) => candidate.id === id);

      if (!group) {
        throw new LocalApiError("La sala no existe.", 404);
      }

      if (group.creator_id !== user.id) {
        throw new LocalApiError(
          "Solo el organizador puede ejecutar el sorteo.",
          403,
        );
      }

      if (group.status === "completed") {
        throw new LocalApiError(
          "El sorteo de esta sala ya se realizó.",
          409,
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
        .map((exclusion) => ({
          user_id_1: exclusion.user_id_1,
          user_id_2: exclusion.user_id_2,
        }));

      let pairs: DrawPair[];

      try {
        pairs = buildDraw(members, exclusions);
      } catch (error) {
        if (error instanceof DrawError) {
          throw new LocalApiError(error.message, 409, error.code);
        }

        throw error;
      }

      const createdAt = new Date().toISOString();

      const drawResults: DrawResult[] = pairs.map((pair) => ({
        id: `draw_${randomUUID()}`,
        group_id: group.id,
        giver_id: pair.giver_id,
        receiver_id: pair.receiver_id,
        created_at: createdAt,
      }));

      database.draw_results.push(...drawResults);
      group.status = "completed";
      group.completed_at = createdAt;

      return {
        group: { ...group } as Group,
        members: members.map((member) => ({ ...member })) as GroupMember[],
        pairsCreated: pairs.length,
      };
    });

    let emailResult = null;

    if (result.group.send_emails) {
      try {
        emailResult = await sendDrawEmails({
          groupName: result.group.name,
          groupUrl: `${getAppUrl(request)}/groups/${result.group.id}`,
          minBudget: Number(result.group.min_budget),
          maxBudget: Number(result.group.max_budget),
          currency: result.group.currency,
          recipients: result.members.map((member) => ({
            full_name: member.full_name,
            email: member.email,
          })),
        });
      } catch (emailError) {
        console.error("draw email error", emailError);
        emailResult = {
          sent: 0,
          failed: 0,
          skipped: true,
          message:
            "El sorteo se completó, pero no pudimos enviar los correos de notificación.",
        };
      }
    } else {
      emailResult = {
        sent: 0,
        failed: 0,
        skipped: true,
        message:
          "El sorteo se completó sin enviar correos (opción desactivada).",
      };
    }

    return NextResponse.json({
      ok: true,
      pairsCreated: result.pairsCreated,
      emailResult,
    });
  } catch (error) {
    return localErrorResponse(error);
  }
}
