"use client";

import { useState } from "react";
import { Ban, Unlock } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import type { GroupBan } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface BlockedMembersPanelProps {
  groupId: string;
  bans: GroupBan[];
  onChanged?: () => void | Promise<void>;
}

export function BlockedMembersPanel({
  groupId,
  bans,
  onChanged,
}: BlockedMembersPanelProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<GroupBan | null>(null);
  const [unblocking, setUnblocking] = useState(false);

  async function handleUnblock() {
    if (!selected) return;

    setUnblocking(true);

    try {
      const response = await fetch(
        `/api/groups/${groupId}/bans/${selected.user_id}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "No pudimos desbloquear a la persona.");
      }

      toast({
        title: "Participante desbloqueado",
        description: `${selected.full_name} ya puede volver a unirse con el código de la sala.`,
        variant: "success",
      });
      setSelected(null);
      await onChanged?.();
    } catch (error) {
      toast({
        title: "No pudimos desbloquear",
        description:
          error instanceof Error ? error.message : "Inténtalo de nuevo.",
        variant: "error",
      });
    } finally {
      setUnblocking(false);
    }
  }

  return (
    <>
      <Card className="overflow-hidden border-terra/15">
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4 sm:px-6">
          <span className="flex size-9 items-center justify-center rounded-xl bg-terra/10 text-terra-deep">
            <Ban className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-xl text-ink">
              Participantes bloqueados
            </h2>
            <p className="text-[11px] font-medium text-muted">
              No pueden volver a unirse con el código de esta sala.
            </p>
          </div>
        </div>

        <ul className="divide-y divide-line/70">
          {bans.map((ban) => (
            <li
              key={ban.id}
              className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6"
            >
              <Avatar name={ban.full_name} src={ban.avatar_url} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {ban.full_name}
                </p>
                <p className="truncate text-xs text-muted">
                  {ban.email ?? "Sin correo"} · bloqueado el{" "}
                  {formatDate(ban.blocked_at, false)}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setSelected(ban)}
              >
                <Unlock className="size-4" aria-hidden />
                Desbloquear
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={Boolean(selected)}
        title="¿Desbloquear a esta persona?"
        description={
          selected
            ? `${selected.full_name} podrá volver a unirse a esta sala con el código o el enlace de invitación.`
            : ""
        }
        confirmLabel="Sí, desbloquear"
        cancelLabel="Cancelar"
        loading={unblocking}
        icon={<Unlock className="size-5" />}
        onConfirm={() => void handleUnblock()}
        onClose={() => {
          if (!unblocking) setSelected(null);
        }}
      />
    </>
  );
}
