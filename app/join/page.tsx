import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Hash } from "lucide-react";

import { JoinByCodeForm } from "@/components/groups/join-by-code-form";
import { Card } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Unirse con código",
  description:
    "Entra a tu amigo secreto con el código de sala que te compartió el organizador.",
};

export default function JoinIndexPage() {
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
        <div className="relative">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-pine/10 text-pine">
            <Hash className="size-6" aria-hidden />
          </span>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-pine">
            Ya tienes un código
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.03] tracking-[-0.02em] text-ink sm:text-5xl">
            Entra a tu sala.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
            Pide al organizador el código de la sala y escríbelo aquí. Si aún no
            tienes cuenta, te ayudaremos a crearla.
          </p>

          <div className="mx-auto mt-8 max-w-md text-left">
            <JoinByCodeForm />
          </div>

          <p className="mx-auto mt-5 max-w-sm text-xs leading-relaxed text-muted">
            El código tiene entre 6 y 32 caracteres. No distingue mayúsculas de
            minúsculas.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Volver al inicio
          </Link>
        </div>
      </Card>
    </div>
  );
}
