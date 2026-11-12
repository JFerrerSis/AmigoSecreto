"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Gift, Hash, Plus, RefreshCw, UserRound } from "lucide-react";

import { GroupCard } from "@/components/groups/group-card";
import { JoinByCodeForm } from "@/components/groups/join-by-code-form";
import { Button, buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, Skeleton } from "@/components/ui/misc";
import { useLocalUser } from "@/hooks/use-local-user";
import type { GroupWithCount } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "pending" | "completed";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "En curso" },
  { value: "completed", label: "Completadas" },
];

function dashboardCacheKey(userId: string) {
  return `amigo-secreto:dashboard:${userId}`;
}

function readCachedGroups(userId: string): GroupWithCount[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(dashboardCacheKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as GroupWithCount[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function cacheGroups(userId: string, groups: GroupWithCount[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      dashboardCacheKey(userId),
      JSON.stringify(groups),
    );
  } catch {
    return;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useLocalUser();
  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const loadGroups = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const cached = readCachedGroups(user.id);

    if (cached) {
      setGroups(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await fetch("/api/groups", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as
        | { groups?: GroupWithCount[]; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "No pudimos cargar tus salas.");
      }

      const nextGroups = payload?.groups ?? [];
      setGroups(nextGroups);
      cacheGroups(user.id, nextGroups);
    } catch (queryError) {
      console.error("dashboard groups error", queryError);
      setError(
        queryError instanceof Error
          ? queryError.message
          : "No pudimos cargar tus salas. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      router.replace("/sign-in?redirect_url=/dashboard");
      return;
    }

    void loadGroups();
  }, [loadGroups, router, user, userLoading]);

  useEffect(() => {
    function handleFocus() {
      if (user) void loadGroups();
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadGroups, user]);

  const visibleGroups = groups.filter((group) =>
    filter === "all" ? true : group.status === filter,
  );

  const firstName = user?.full_name?.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pine">
            Tu mesa de intercambios
          </p>
          <h1 className="mt-2 font-display text-4xl leading-[1.02] tracking-[-0.02em] text-ink sm:text-5xl">
            {firstName ? `Hola, ${firstName}.` : "Tus salas."}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
            Organiza un nuevo amigo secreto o entra a una sala donde ya
            participas. Tus resultados siempre son privados.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/perfil"
            className={buttonStyles({
              variant: "secondary",
              size: "lg",
              className: "w-full sm:w-auto",
            })}
          >
            <UserRound className="size-4" aria-hidden />
            Mi perfil
          </Link>
          <Link
            href="/groups/new"
            className={buttonStyles({
              size: "lg",
              className: "w-full sm:w-auto",
            })}
          >
            <Plus className="size-4" aria-hidden />
            Nueva sala
          </Link>
        </div>
      </div>

      <Card className="mt-8 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-gold/20 text-[#7a571a]">
              <Hash className="size-5" aria-hidden />
            </span>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-pine">
              ¿Te invitaron?
            </p>
            <h2 className="mt-1 font-display text-2xl leading-tight text-ink">
              Únete con un código
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Pide al organizador el código de la sala. También puedes usar el
              link de invitación.
            </p>
          </div>
          <JoinByCodeForm className="max-w-md" />
        </div>
      </Card>

      <div className="mt-10 flex items-center justify-between gap-4 border-b border-line/70 pb-4">
        <div className="flex gap-1">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                filter === item.value
                  ? "bg-ink text-paper"
                  : "text-muted hover:bg-sand hover:text-ink",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="hidden text-xs font-medium text-muted sm:block">
          {groups.length} {groups.length === 1 ? "sala" : "salas"} en total
        </span>
      </div>

      <div className="mt-6">
        {userLoading || loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-3xl border border-line bg-paper p-6"
              >
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-32 rounded-full" />
                  <Skeleton className="size-9 rounded-full" />
                </div>
                <Skeleton className="mt-6 h-8 w-3/4" />
                <Skeleton className="mt-3 h-4 w-1/2" />
                <Skeleton className="mt-8 h-4 w-full" />
                <Skeleton className="mt-3 h-1.5 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-terra/20 bg-paper p-8 text-center shadow-soft">
            <p className="text-sm font-medium text-terra-deep">{error}</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => void loadGroups()}
            >
              <RefreshCw className="size-4" aria-hidden />
              Reintentar
            </Button>
          </div>
        ) : visibleGroups.length === 0 ? (
          <EmptyState
            icon={Gift}
            title={
              groups.length === 0
                ? "Todavía no tienes salas"
                : "No hay salas en este filtro"
            }
            description={
              groups.length === 0
                ? "Crea tu primera sala y comparte el link con tu grupo. En menos de dos minutos ya estarán todos dentro."
                : "Prueba con otro filtro o crea una nueva sala para empezar otro intercambio."
            }
            action={
              <Link href="/groups/new" className={buttonStyles({ size: "lg" })}>
                <Plus className="size-4" aria-hidden />
                Crear mi primera sala
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                userId={user?.id ?? ""}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
