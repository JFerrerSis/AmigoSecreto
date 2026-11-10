import "server-only";

import { Resend } from "resend";

import { formatCurrency } from "@/lib/utils";

export interface DrawEmailRecipient {
  full_name: string;
  email: string | null;
}

interface SendDrawEmailsInput {
  groupName: string;
  groupUrl: string;
  minBudget: number;
  maxBudget: number;
  currency: string;
  recipients: DrawEmailRecipient[];
}

export interface DrawEmailDelivery {
  email: string;
  full_name: string;
  status: "sent" | "failed";
  error?: string;
}

export interface SendDrawEmailsResult {
  sent: number;
  failed: number;
  skipped: boolean;
  message?: string;
  deliveries: DrawEmailDelivery[];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function budgetLabel(minBudget: number, maxBudget: number, currency: string) {
  if (minBudget === maxBudget) return formatCurrency(minBudget, currency);
  return `${formatCurrency(minBudget, currency)} - ${formatCurrency(
    maxBudget,
    currency,
  )}`;
}

function buildHtml({
  groupName,
  groupUrl,
  minBudget,
  maxBudget,
  currency,
  recipientName,
}: SendDrawEmailsInput & { recipientName: string }) {
  const safeGroupName = escapeHtml(groupName);
  const safeRecipientName = escapeHtml(recipientName);
  const budget = escapeHtml(budgetLabel(minBudget, maxBudget, currency));

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>El sorteo ya está listo</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f0e6;font-family:Inter,Segoe UI,Arial,sans-serif;color:#1e1c19;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f0e6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffdf8;border:1px solid #e1d9cb;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:40px 40px 12px 40px;">
                <div style="display:inline-block;background:#2f5d50;color:#fffdf8;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:8px 14px;border-radius:999px;">
                  Sorteo completado
                </div>
                <h1 style="margin:24px 0 12px;font-family:Georgia,serif;font-size:34px;line-height:1.15;font-weight:400;color:#1e1c19;">
                  Hola, ${safeRecipientName}.
                </h1>
                <p style="margin:0;font-size:16px;line-height:1.65;color:#6b665d;">
                  El amigo secreto de <strong style="color:#1e1c19;">${safeGroupName}</strong> ya fue asignado. Entra a tu sala privada para descubrir a quién te toca regalar.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f0e6;border-radius:20px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6b665d;">Presupuesto sugerido</p>
                      <p style="margin:0;font-size:22px;font-weight:700;color:#2f5d50;">${budget}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 12px;">
                <a href="${escapeHtml(groupUrl)}" style="display:block;text-align:center;background:#2f5d50;color:#fffdf8;text-decoration:none;font-size:16px;font-weight:700;padding:16px 24px;border-radius:999px;">
                  Ver mi amigo secreto
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 40px 40px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#6b665d;">
                  Por privacidad, tu asignación solo se muestra dentro de la sala y únicamente en tu sesión. Nadie más puede verla.
                </p>
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:20px auto 0;font-size:12px;line-height:1.6;color:#8a847a;text-align:center;">
            Recibiste este correo porque participas en ${safeGroupName}. Si crees que es un error, ignora este mensaje.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendDrawEmails(
  input: SendDrawEmailsInput,
): Promise<SendDrawEmailsResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      sent: 0,
      failed: 0,
      skipped: true,
      message:
        "El sorteo se completó, pero Resend no está configurado. No se enviaron correos.",
      deliveries: [],
    };
  }

  const seen = new Set<string>();
  const recipients = input.recipients.filter((recipient) => {
    const email = recipient.email?.trim().toLowerCase();

    if (!email || seen.has(email)) return false;

    seen.add(email);
    return true;
  });

  if (recipients.length === 0) {
    return {
      sent: 0,
      failed: 0,
      skipped: true,
      message: "No hay correos de participantes para notificar.",
      deliveries: [],
    };
  }

  const resend = new Resend(apiKey);
  const deliveries: DrawEmailDelivery[] = [];
  let sent = 0;
  let failed = 0;

  for (let index = 0; index < recipients.length; index += 10) {
    const batch = recipients.slice(index, index + 10);

    const results = await Promise.all(
      batch.map(async (recipient): Promise<DrawEmailDelivery> => {
        const email = recipient.email!.trim();

        try {
          const { error } = await resend.emails.send({
            from,
            to: email,
            subject: `El sorteo de ${input.groupName} ya está listo`,
            html: buildHtml({ ...input, recipientName: recipient.full_name }),
            text: `Hola, ${recipient.full_name}. El amigo secreto de ${input.groupName} ya está listo. Presupuesto: ${budgetLabel(input.minBudget, input.maxBudget, input.currency)}. Consulta tu asignación aquí: ${input.groupUrl}`,
          });

          if (error) {
            failed += 1;
            return {
              email,
              full_name: recipient.full_name,
              status: "failed",
              error: error.message,
            };
          }

          sent += 1;
          return {
            email,
            full_name: recipient.full_name,
            status: "sent",
          };
        } catch (sendError) {
          failed += 1;
          return {
            email,
            full_name: recipient.full_name,
            status: "failed",
            error:
              sendError instanceof Error
                ? sendError.message
                : "Error desconocido al enviar el correo.",
          };
        }
      }),
    );

    deliveries.push(...results);
  }

  return {
    sent,
    failed,
    skipped: false,
    message:
      failed > 0
        ? `Se enviaron ${sent} correos y ${failed} fallaron.`
        : undefined,
    deliveries,
  };
}
