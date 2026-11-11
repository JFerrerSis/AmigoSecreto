import { NextResponse } from "next/server";

import { recordEmailDeliveries } from "@/lib/db/email-deliveries";
import { runGroupDraw } from "@/lib/db/groups";
import { sendDrawEmails } from "@/lib/email";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";

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
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "group-draw",
      limit: 10,
      windowMs: 10 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const { id } = await params;

    const result = await runGroupDraw(id, user.id);

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

        if (emailResult.deliveries.length > 0) {
          await recordEmailDeliveries(
            result.group.id,
            emailResult.deliveries,
          ).catch((logError) => {
            console.error("email delivery log error", logError);
          });
        }
      } catch (emailError) {
        console.error("draw email error", emailError);
        emailResult = {
          sent: 0,
          failed: 0,
          skipped: true,
          message:
            "El sorteo se completó, pero no pudimos enviar los correos de notificación.",
          deliveries: [],
        };
      }
    } else {
      emailResult = {
        sent: 0,
        failed: 0,
        skipped: true,
        message:
          "El sorteo se completó sin enviar correos (opción desactivada).",
        deliveries: [],
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
