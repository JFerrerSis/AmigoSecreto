import Link from "next/link";
import { ArrowRight, Check, LogIn, Sparkles } from "lucide-react";

import { HeroCard } from "@/components/landing/hero-card";
import { buttonStyles } from "@/components/ui/button";

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative overflow-hidden pb-20 pt-10 sm:pt-16 lg:pb-28">
      <div
        aria-hidden
        className="bg-dots pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-[0.28] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-5 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted shadow-soft">
            <Sparkles className="size-3.5 text-gold-deep" aria-hidden />
            Sorteos privados para grupos reales
          </span>

          <h1 className="mt-6 max-w-[11ch] font-display text-[clamp(3.2rem,8vw,5.6rem)] leading-[0.93] tracking-[-0.025em] text-ink">
            Quién le regala a quién,{" "}
            <em className="text-pine">sin enredos.</em>
          </h1>

          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">
            Crea la sala, invita con un link y ejecuta un sorteo justo. Cada
            persona descubre su amigo secreto en privado, con presupuesto y
            reglas claras.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={signedIn ? "/dashboard" : "/sign-up"}
              className={buttonStyles({ size: "lg" })}
            >
              {signedIn ? "Ir a mis salas" : "Crear mi cuenta gratis"}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href={signedIn ? "/groups/new" : "/sign-in"}
              className={buttonStyles({ variant: "secondary", size: "lg" })}
            >
              {signedIn ? "Nueva sala" : "Ingresar"}
              <LogIn className="size-4" aria-hidden />
            </Link>
          </div>

          <Link
            href="#como-funciona"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted underline-offset-4 transition hover:text-ink hover:underline"
          >
            Ver cómo funciona
          </Link>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-pine/10 text-pine">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
              Sin descargas
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-pine/10 text-pine">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
              Listo en 2 minutos
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-pine/10 text-pine">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
              Resultados privados
            </span>
          </div>
        </div>

        <HeroCard />
      </div>
    </section>
  );
}
