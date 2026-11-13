"use client";

import { useState } from "react";
import { Crown, Mail, Trash2, Users } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/misc";
import type { GroupMember } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ParticipantListProps {
  members: GroupMember[];
  creatorId: string;
  currentUserId: string;
  maxParticipants: number;
  isCreator: boolean;
  status: "pending" | "completed";
  onRemove?: (
    member: GroupMember,
    options: { block: boolean },
  ) => Promise<boolean>;
}

export function ParticipantList({
  members,
  creatorId,
  currentUserId,
  maxParticipants,
  isCreator,
  status,
  onRemove,
}: ParticipantListProps) {
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [removing, setRemoving] = useState(false);
  const [blockReentry, setBlockReentry] = useState(false);

  async function handleRemove() {
    if (!memberToRemove || !onRemove) return;

    setRemoving(true);

    try {
      const removed = await onRemove(memberToRemove, {
        block: blockReentry,
      });
      if (removed) setMemberToRemove(null);
    } catch {
      return;
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-line bg-paper shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-cream text-pine">
              <Users className="size-4" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-xl text-ink">Participantes</h2>
              <p className="text-[11px] font-medium text-muted">
                {members.length} de {maxParticipants} lugares ocupados
              </p>
            </div>
          </div>

          {status === "pending" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pine/15 bg-pine/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-pine">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-pine opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-pine" />
              </span>
              En vivo
            </span>
          ) : (
            <Badge variant="completed">Lista cerrada</Badge>
          )}
        </div>

        <ul className="divide-y divide-line/70">
          {members.map((member) => {
            const isGroupCreator = member.user_id === creatorId;
            const isCurrentUser = member.user_id === currentUserId;

            return (
              <li
                key={member.id}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-cream/40 sm:px-6"
              >
                <Avatar
                  name={member.full_name}
                  src={member.avatar_url}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-ink">
                      {member.full_name}
                    </p>
                    {isCurrentUser ? (
                      <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-paper">
                        Tú
                      </span>
                    ) : null}
                    {isGroupCreator ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#7a571a]">
                        <Crown className="size-2.5" aria-hidden />
                        Organizador
                      </span>
                    ) : null}
                  </div>
                  {isCreator && member.email ? (
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted">
                      <Mail className="size-3 shrink-0" aria-hidden />
                      <span className="truncate">{member.email}</span>
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-muted">
                      Se unió el {formatDate(member.joined_at, false)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden text-[11px] text-muted sm:block">
                    {isCreator && member.email
                      ? formatDate(member.joined_at, false)
                      : ""}
                  </span>
                  {onRemove && !isGroupCreator && status === "pending" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2 text-muted hover:bg-terra/10 hover:text-terra-deep"
                      onClick={() => {
                        setBlockReentry(false);
                        setMemberToRemove(member);
                      }}
                      aria-label={`Sacar a ${member.full_name} de la sala`}
                      title={`Sacar a ${member.full_name}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {status === "pending" ? (
          <div className="border-t border-line bg-cream/50 px-5 py-3 text-[11px] leading-relaxed text-muted sm:px-6">
            La lista se actualiza automáticamente cuando alguien se une con el
            código o el link de invitación.
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={Boolean(memberToRemove)}
        title={
          memberToRemove
            ? `¿Sacar a ${memberToRemove.full_name}?`
            : "¿Sacar participante?"
        }
        description={
          blockReentry
            ? "Saldrá de la sala, se borrarán sus exclusiones y no podrá volver a unirse con el código."
            : "Saldrá de la sala y se borrarán sus exclusiones. Si no lo bloqueas, podría volver a unirse con el código."
        }
        confirmLabel="Sí, sacar de la sala"
        cancelLabel="Cancelar"
        loading={removing}
        tone="danger"
        icon={<Trash2 className="size-5" />}
        onConfirm={() => void handleRemove()}
        onClose={() => {
          if (!removing) {
            setMemberToRemove(null);
            setBlockReentry(false);
          }
        }}
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-cream/60 p-4">
          <input
            type="checkbox"
            checked={blockReentry}
            onChange={(event) => setBlockReentry(event.target.checked)}
            disabled={removing}
            className="mt-0.5 size-4 shrink-0 accent-pine"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">
              Bloquear reingreso
            </span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
              No podrá volver a entrar a esta sala con el código ni con el link
              de invitación.
            </span>
          </span>
        </label>
      </ConfirmDialog>
    </>
  );
}
