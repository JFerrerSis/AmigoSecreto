"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button, buttonStyles } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-2xl items-center px-5 py-16">
      <div className="w-full rounded-4xl border border-terra/20 bg-paper p-8 text-center shadow-soft sm:p-12">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-terra/10 text-terra-deep">
          <AlertTriangle className="size-6" aria-hidden />
        </span>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-terra">
          Algo salió mal
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink">
          No pudimos mostrar esta pantalla.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          {error.message ||
            "Ocurrió un error inesperado. Puedes reintentar sin perder tus datos locales."}
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-[10px] text-muted">
            Código: {error.digest}
          </p>
        ) : null}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>
            <RefreshCw className="size-4" aria-hidden />
            Reintentar
          </Button>
          <Link
            href="/dashboard"
            className={buttonStyles({ variant: "secondary" })}
          >
            Ir a mis salas
          </Link>
        </div>
      </div>
    </div>
  );
}
