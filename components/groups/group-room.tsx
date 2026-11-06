"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Check,
  Copy,
  Gift,
  Link2,
  LockKeyhole,
  Mail,
  RefreshCw,
  Share2,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { DrawPanel } from "@/components/groups/draw-panel";
import { ExclusionsManager } from "@/components/groups/exclusions-manager";
import { ParticipantList } from "@/components/groups/participant-list";
import { RevealCard } from "@/components/groups/reveal-card";
import { Button, buttonStyles } from "@/components/ui/button";
import { Badge, Card, InlineAlert, Skeleton } from "@/components/ui/misc";
import { useCopy } from "@/hooks/use-copy";
import { useGroupData } from "@/hooks/use-group-data";
import { useLocalUser } from "@/hooks/use-local-user";
import { useToast } from "@/components/ui/toast";
import {
  formatCurrency,
  formatDate,
  pluralize,
} from "@/lib/utils";

export function GroupRoom({ groupId }: { groupId: string }) {
  const { user, loading: userLoading } = useLocalUser();
  const isLoaded = !userLoading;
  const userId = user?.id ?? "";
  const {
    group,
    members,
    exclusions,
    drawResult,
    loading,
    error,
    refresh,
  } = useGroupData(groupId, userId);

  const { toast } = useToast();
  const { copied, copy } = useCopy();
  const [origin, setOrigin] = useState("");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator !== "undefined" && Boolean(navigator.share));
  }, []);

  const creator = useMemo(
    () => members.find((member) => member.user_id === group?.creator_id),
    [group?.creator_id, members],
  );

  const receiver = useMemo(
    () =>
      drawResult
        ? members.find((member) => member.user_id === drawResult.receiver_id)
        : undefined,
    [drawResult, members],
  );

  const emailCount = useMemo(
    () =>
      new Set(
        members
          .map((member) => member.email?.trim().toLowerCase())
          .filter((email): email is string => Boolean(email)),
      ).size,
    [members],
  );

  if (!isLoaded || (loading && !group)) {
    return <GroupRoomSkeleton />;
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-16">
        <Card className="p-8 text-center sm:p-12">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gold/20 text-[#7a571a]">
            <LockKeyhole className="size-6" aria-hidden />
          </span>
          <h1 className="mt-6 font-display text-4xl leading-tight text-ink">
            Necesitas una identidad local.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            Crea tu identidad con nombre y correo para entrar a esta sala y ver
            tu resultado privado.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/sign-in?redirect_url=/groups/${groupId}`}
              className={buttonStyles({ size: "lg" })}
            >
              Entrar a la sala
            </Link>
            <Link
              href="/"
              className={buttonStyles({ variant: "secondary", size: "lg" })}
            >
              Volver al inicio
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-16">
        <Card className="p-8 text-center sm:p-12">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-terra/10 text-terra-deep">
            <LockKeyhole className="size-6" aria-hidden />
          </span>
          <h1 className="mt-6 font-display text-4xl leading-tight text-ink">
            No pudimos abrir esta sala.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            {error ??
              "Puede que el enlace haya expirado o que no tengas acceso a este grupo."}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => void refresh()}>
              <RefreshCw className="size-4" aria-hidden />
              Reintentar
            </Button>
            <Link
              href="/dashboard"
              className={buttonStyles({ variant: "secondary" })}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Ir a mis salas
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isCreator = group.creator_id === userId;
  const inviteUrl = origin ? `${origin}/join/${group.invite_code}` : "";
  const budget =
    Number(group.min_budget) === Number(group.max_budget)
      ? formatCurrency(group.min_budget, group.currency)
      : `${formatCurrency(group.min_budget, group.currency)} – ${formatCurrency(
          group.max_budget,
          group.currency,
        )}`;

  async function copyInvite() {
    if (!inviteUrl) return;

    const success = await copy(inviteUrl);

    toast(
      success
        ? {
            title: "Enlace copiado",
            description: "Compártelo con tu grupo para que se unan.",
            variant: "success",
          }
        : {
            title: "No se pudo copiar",
            description: "Selecciona el enlace manualmente e inténtalo de nuevo.",
            variant: "error",
          },
    );
  }

  async function shareInvite() {
    if (!inviteUrl) return;

    if (canShare) {
      try {
        await navigator.share({
          title: `Amigo Secreto: ${group?.name ?? "Invitación"}`,
          text: "Únete a mi amigo secreto y descubre a quién te toca regalar.",
          url: inviteUrl,
        });
        return;
      } catch {
        return;
      }
    }

    await copyInvite();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full py-1 text-sm font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Mis salas
        </Link>
        <Badge variant={group.status === "completed" ? "completed" : "pending"}>
          {group.status === "completed" ? (
            <>
              <Check className="size-3" aria-hidden />
              Sorteo completado
            </>
          ) : (
            <>
              <Sparkles className="size-3" aria-hidden />
              Inscripciones abiertas
            </>
          )}
        </Badge>
      </div>

      {error ? (
        <InlineAlert className="mt-5" variant="warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="font-semibold text-ink">No pudimos sincronizar la sala</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void refresh()}
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Reintentar
          </Button>
        </InlineAlert>
      ) : null}

      <div className="mt-5">
        <h1 className="max-w-3xl font-display text-4xl leading-[1.02] tracking-[-0.02em] text-ink sm:text-5xl">
          {group.name}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-2">
            <Wallet className="size-4 text-pine" aria-hidden />
            {budget}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarClock className="size-4 text-pine" aria-hidden />
            {formatDate(group.draw_at)}
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="size-4 text-pine" aria-hidden />
            {members.length} de {group.max_participants}{" "}
            {pluralize(group.max_participants, "lugar", "lugares")}
          </span>
        </div>
      </div>

      <Card className="mt-7 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-pine/10 text-pine">
            <Link2 className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              {group.status === "pending"
                ? "Link de invitación"
                : "Link de la sala"}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-ink sm:text-sm">
              {inviteUrl || `/join/${group.invite_code}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {canShare ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void shareInvite()}
            >
              <Share2 className="size-4" aria-hidden />
              Compartir
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void copyInvite()}
            disabled={!inviteUrl}
          >
            {copied ? (
              <Check className="size-4 text-pine" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copied ? "Copiado" : "Copiar link"}
          </Button>
        </div>
      </Card>

      {group.status === "completed" ? (
        <p className="mt-2 px-1 text-[11px] text-muted">
          El sorteo ya se realizó. El link se conserva para que los
          participantes vuelvan a consultar su resultado.
        </p>
      ) : null}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {group.status === "completed" ? (
            receiver && drawResult ? (
              <RevealCard group={group} receiver={receiver} userId={userId} />
            ) : (
              <Card className="p-8 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-terra/10 text-terra-deep">
                  <AlertTriangle className="size-5" aria-hidden />
                </span>
                <h2 className="mt-4 font-display text-2xl text-ink">
                  No pudimos mostrar tu resultado
                </h2>
                <InlineAlert className="mx-auto mt-4 max-w-lg text-left">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <p className="text-xs">
                    {drawResult
                      ? "Tu asignación existe, pero el participante asignado ya no aparece en la lista. Pide al organizador que revise la sala."
                      : "El sorteo figura como completado, pero no hay una asignación guardada para tu identidad. Reintenta la sincronización; si el problema continúa, avisa al organizador."}
                  </p>
                </InlineAlert>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button onClick={() => void refresh()}>
                    <RefreshCw className="size-4" aria-hidden />
                    Reintentar
                  </Button>
                  <Link
                    href="/dashboard"
                    className={buttonStyles({ variant: "secondary" })}
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                    Ir a mis salas
                  </Link>
                </div>
              </Card>
            )
          ) : (
            <WaitingCard
              isCreator={isCreator}
              memberCount={members.length}
              sendEmails={group.send_emails}
            />
          )}

          <ParticipantList
            members={members}
            creatorId={group.creator_id}
            currentUserId={userId}
            maxParticipants={group.max_participants}
            isCreator={isCreator}
            status={group.status}
          />

          {isCreator && group.status === "pending" ? (
            <ExclusionsManager
              groupId={group.id}
              members={members}
              exclusions={exclusions}
              onChanged={() => void refresh(true)}
            />
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-xl text-ink">Detalles</h2>
            </div>
            <div className="space-y-4 p-5">
              <DetailRow
                icon={Wallet}
                label="Presupuesto"
                value={budget}
              />
              <DetailRow
                icon={CalendarClock}
                label="Fecha límite"
                value={formatDate(group.draw_at)}
              />
              <DetailRow
                icon={Users}
                label="Cupo"
                value={`${members.length} de ${group.max_participants}`}
              />
              <DetailRow
                icon={Mail}
                label="Notificaciones"
                value={
                  group.send_emails
                    ? `${emailCount} ${pluralize(emailCount, "correo", "correos")}`
                    : "Desactivadas"
                }
              />
              <div className="h-px bg-line" />
              <div className="flex items-center gap-3">
                <Avatar
                  name={creator?.full_name ?? "Organizador"}
                  src={creator?.avatar_url}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    Organizador
                  </p>
                  <p className="truncate text-sm font-semibold text-ink">
                    {creator?.user_id === userId
                      ? "Tú"
                      : (creator?.full_name ?? "El organizador")}
                  </p>
                </div>
              </div>
              <p className="text-[10px] leading-relaxed text-muted">
                Creada el {formatDate(group.created_at, false)}
              </p>
            </div>
          </Card>

          {isCreator && group.status === "pending" ? (
            <DrawPanel
              group={group}
              memberCount={members.length}
              emailCount={emailCount}
              exclusionsCount={exclusions.length}
              onDrawn={() => void refresh(true)}
            />
          ) : null}

          {group.status === "completed" ? (
            <Card className="border-pine/15 bg-pine/5 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
                  <Check className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Sorteo completado
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {group.completed_at
                      ? `Realizado el ${formatDate(group.completed_at)}.`
                      : "Las asignaciones ya están disponibles."}{" "}
                    Cada participante solo puede ver la suya.
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <Card className="border-line bg-cream/60 p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-paper text-pine shadow-soft">
                <LockKeyhole className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  Privacidad garantizada
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Las asignaciones se guardan en la base local del proyecto y
                  solo se entregan a la sesión de cada participante. El
                  organizador tampoco ve a quién te tocó regalar.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-pine" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

function WaitingCard({
  isCreator,
  memberCount,
  sendEmails,
}: {
  isCreator: boolean;
  memberCount: number;
  sendEmails: boolean;
}) {
  return (
    <section className="relative overflow-hidden rounded-4xl border border-dashed border-line bg-paper/80 p-8 text-center shadow-soft sm:p-10">
      <div
        aria-hidden
        className="absolute -right-16 -top-16 size-52 rounded-full bg-gold/15 blur-2xl"
      />
      <div
        aria-hidden
        className="bg-dots pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <div className="relative">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-cream text-pine">
          <Gift className="size-6" aria-hidden />
        </span>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-pine">
          {isCreator ? "Todo listo para el sorteo" : "La sorpresa sigue guardada"}
        </p>
        <h2 className="mx-auto mt-2 max-w-xl font-display text-3xl leading-[1.05] tracking-[-0.01em] text-ink sm:text-4xl">
          {isCreator
            ? "Cuando todos estén dentro, haz magia."
            : "El organizador ejecutará el sorteo pronto."}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          {isCreator
            ? "Revisa las exclusiones, comparte el link y ejecuta el sorteo desde el panel de organizador. En ese momento se enviarán las notificaciones."
            : `Ya hay ${memberCount} ${pluralize(
                memberCount,
                "participante",
                "participantes",
              )} en la sala. ${
                sendEmails
                  ? "Recibirás un correo cuando el sorteo esté listo."
                  : "Vuelve a esta sala cuando el organizador haya hecho el sorteo."
              }`}
        </p>
      </div>
    </section>
  );
}

function GroupRoomSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-5 h-12 w-2/3 max-w-xl" />
      <div className="mt-5 flex gap-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="mt-8 h-[76px] w-full rounded-3xl" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-4xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-80 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
