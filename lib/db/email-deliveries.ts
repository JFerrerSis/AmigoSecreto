import "server-only";

import { isUuid, query } from "@/lib/db/pool";
import type { DrawEmailDelivery } from "@/lib/email";

export async function recordEmailDeliveries(
  groupId: string,
  deliveries: DrawEmailDelivery[],
): Promise<void> {
  if (!isUuid(groupId) || deliveries.length === 0) return;

  const payload = deliveries.map((delivery) => ({
    email: delivery.email,
    name: delivery.full_name,
    status: delivery.status,
    error: delivery.error ?? null,
  }));

  await query(
    `insert into public.email_deliveries (
       group_id, recipient_email, recipient_name, status, provider, error_message
     )
     select $1, x.email, x.name, x.status, 'resend', x.error
       from jsonb_to_recordset($2::jsonb)
         as x(email text, name text, status text, error text)`,
    [groupId, JSON.stringify(payload)],
  );
}
