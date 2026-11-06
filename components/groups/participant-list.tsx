import { Crown, Mail, Users } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
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
}

export function ParticipantList({
  members,
  creatorId,
  currentUserId,
  maxParticipants,
  isCreator,
  status,
}: ParticipantListProps) {
  return (
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
              <span className="hidden shrink-0 text-[11px] text-muted sm:block">
                {isCreator && member.email
                  ? formatDate(member.joined_at, false)
                  : ""}
              </span>
            </li>
          );
        })}
      </ul>

      {status === "pending" ? (
        <div className="border-t border-line bg-cream/50 px-5 py-3 text-[11px] leading-relaxed text-muted sm:px-6">
          La lista se actualiza automáticamente cuando alguien se une con el
          link de invitación.
        </div>
      ) : null}
    </section>
  );
}
