import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import type { ReactNode } from "react";

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al inicio
      </Link>

      <div className="mt-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-pine/15 bg-pine/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-pine">
          <FileText className="size-3" aria-hidden />
          Información legal
        </span>
        <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          {intro}
        </p>
        <p className="mt-3 text-xs text-muted">
          Última actualización: 11 de noviembre de 2026
        </p>
      </div>

      <div className="mt-10 rounded-4xl border border-line bg-paper p-6 shadow-soft sm:p-10">
        <div className="space-y-8">{children}</div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted">
        <Link href="/terminos" className="transition hover:text-ink">
          Términos de uso
        </Link>
        <Link href="/privacidad" className="transition hover:text-ink">
          Privacidad
        </Link>
        <Link href="/cookies" className="transition hover:text-ink">
          Uso de cookies
        </Link>
        <Link href="/dashboard" className="transition hover:text-ink">
          Mis salas
        </Link>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl leading-tight text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}
