import Link from "next/link";
import { ArrowUpRight, CalendarClock, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/misc";
import type { GroupWithCount } from "@/lib/types";
import { cn, formatCurrency, formatDate, pluralize } from "@/lib/utils";

export function GroupCard({
  group,
  userId,
}: {
  group: GroupWithCount;
  userId: string;
}) {
  const memberCount = group.group_members?.[0]?.count ?? 0;
  const isCreator = group.creator_id === userId;
  const fillPercentage = Math.min(
    100,
    Math.round((memberCount / group.max_participants) * 100),
  );

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group flex h-full flex-col rounded-3xl border border-line bg-paper p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-pine/20 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={group.status === "completed" ? "completed" : "pending"}>
            {group.status === "completed" ? "Sorteo listo" : "Inscripciones abiertas"}
          </Badge>
          <span className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            {isCreator ? "Organizas" : "Participas"}
          </span>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-cream text-muted transition-all duration-300 group-hover:border-pine group-hover:bg-pine group-hover:text-paper">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>

      <h3 className="mt-5 line-clamp-2 font-display text-[26px] leading-[1.08] tracking-[-0.01em] text-ink">
        {group.name}
      </h3>

      <div className="mt-5 grid gap-2.5 text-sm text-muted">
        <span className="inline-flex items-center gap-2.5">
          <Wallet className="size-4 shrink-0 text-pine" aria-hidden />
          {group.min_budget === group.max_budget
            ? formatCurrency(group.min_budget, group.currency)
            : `${formatCurrency(group.min_budget, group.currency)} – ${formatCurrency(
                group.max_budget,
                group.currency,
              )}`}
        </span>
        <span className="inline-flex items-center gap-2.5">
          <CalendarClock className="size-4 shrink-0 text-pine" aria-hidden />
          {formatDate(group.draw_at)}
        </span>
      </div>

      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Users className="size-3.5" aria-hidden />
            {memberCount} de {group.max_participants}{" "}
            {pluralize(group.max_participants, "lugar", "lugares")}
          </span>
          <span className="text-pine">{fillPercentage}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              group.status === "completed" ? "bg-gold" : "bg-pine",
            )}
            style={{ width: `${Math.max(fillPercentage, 3)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
