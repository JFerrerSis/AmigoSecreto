"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  Link2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useLocalUser } from "@/hooks/use-local-user";

type JoinStatus = "joining" | "error" | "idle";

export function JoinRoom({ code }: { code: string }) {
  const { user, loading } = useLocalUser();
  const isLoaded = !loading;
  const isSignedIn = Boolean(user);
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<JoinStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;
    setStatus("joining");
    setError(null);

    async function join() {
      try {
        const response = await fetch("/api/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const payload = (await response.json()) as {
          error?: string;
          groupId?: string;
          alreadyMember?: boolean;
        };

        if (!response.ok || !payload.groupId) {
          throw new Error(payload.error ?? "No pudimos unirte a la sala.");
        }

        if (cancelled) return;

        toast({
          title: payload.alreadyMember
            ? "Ya estabas en la sala"
            : "Te uniste a la sala",
          description: "Entrando a tu amigo secreto...",
          variant: "success",
        });
        router.replace(`/groups/${payload.groupId}`);
      } catch (joinError) {
        if (cancelled) return;
        setError(
          joinError instanceof Error
            ? joinError.message
            : "No pudimos unirte a la sala.",
        );
        setStatus("error");
      }
    }

    void join();

    return () => {
      cancelled = true;
    };
  }, [attempt, code, isLoaded, isSignedIn, router, toast]);

  if (!isLoaded) {
    return <JoinSkeleton />;
  }

  if (!isSignedIn) {
    const redirect = encodeURIComponent(`/join/${code}`);

    return (
      <JoinShell>
        <span className="flex size-14 items-center justify-center rounded-2xl bg-gold/20 text-[#7a571a]">
          <Gift className="size-6" aria-hidden />
        </span>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-pine">
          Tienes una invitación
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.03] tracking-[-0.02em] text-ink sm:text-5xl">
          Te esperan en un amigo secreto.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Crea tu cuenta con nombre y correo para unirte. Después te
          llevaremos automáticamente de vuelta a esta invitación.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/sign-in?redirect_url=${redirect}`}
            className={buttonStyles({ size: "lg" })}
          >
            Entrar
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href={`/sign-up?redirect_url=${redirect}`}
            className={buttonStyles({ variant: "secondary", size: "lg" })}
          >
            Crear cuenta
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Link2 className="size-3.5 text-pine" aria-hidden />
            Invitación única
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5 text-pine" aria-hidden />
            Lista en tiempo real
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-pine" aria-hidden />
            Resultado privado
          </span>
        </div>
      </JoinShell>
    );
  }

  if (status === "error") {
    return (
      <JoinShell>
        <span className="flex size-14 items-center justify-center rounded-2xl bg-terra/10 text-terra-deep">
          <Gift className="size-6" aria-hidden />
        </span>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-terra">
          No pudimos unirte
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.03] tracking-[-0.02em] text-ink">
          La invitación no está disponible.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {error ?? "Inténtalo de nuevo o pide un nuevo link al organizador."}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            onClick={() => {
              setAttempt((current) => current + 1);
            }}
          >
            <RefreshCw className="size-4" aria-hidden />
            Reintentar
          </Button>
          <Link
            href="/dashboard"
            className={buttonStyles({ variant: "secondary", size: "lg" })}
          >
            Ir a mis salas
          </Link>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Volver al inicio
        </Link>
      </JoinShell>
    );
  }

  return (
    <JoinShell>
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-pine/10 text-pine">
        <Sparkles className="size-6 animate-pulse" aria-hidden />
      </span>
      <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-pine">
        Uniéndote a la sala
      </p>
      <h1 className="mt-3 font-display text-4xl leading-[1.03] tracking-[-0.02em] text-ink">
        Un momento, ya casi estás dentro.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Estamos confirmando tu lugar y preparando la sala.
      </p>
      <div className="mx-auto mt-8 max-w-xs space-y-3">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-full mx-auto" />
        <Skeleton className="h-4 w-2/3 mx-auto" />
      </div>
    </JoinShell>
  );
}

function JoinShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-72px)] w-full max-w-2xl items-center justify-center px-5 py-14">
      <div
        aria-hidden
        className="bg-dots pointer-events-none absolute inset-0 opacity-[0.25] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
      />
      <Card className="relative w-full overflow-hidden rounded-4xl border-line bg-paper/95 px-6 py-10 text-center shadow-lift backdrop-blur sm:px-12 sm:py-14">
        <div
          aria-hidden
          className="absolute -right-16 -top-16 size-56 rounded-full bg-gold/15 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-20 size-56 rounded-full bg-pine/10 blur-2xl"
        />
        <div className="relative">{children}</div>
      </Card>
    </div>
  );
}

function JoinSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-16">
      <Card className="p-10">
        <Skeleton className="mx-auto size-14 rounded-2xl" />
        <Skeleton className="mx-auto mt-6 h-4 w-32" />
        <Skeleton className="mx-auto mt-4 h-10 w-3/4" />
        <Skeleton className="mx-auto mt-3 h-4 w-2/3" />
        <Skeleton className="mx-auto mt-8 h-12 w-full max-w-xs rounded-full" />
      </Card>
    </div>
  );
}
