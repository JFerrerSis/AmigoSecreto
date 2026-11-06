import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";

export function FinalCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="px-5 pb-20 pt-4 sm:pb-24">
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-5xl bg-pine px-6 py-16 text-paper shadow-float sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="absolute -right-20 -top-24 size-80 rounded-full border border-paper/10"
        />
        <div
          aria-hidden
          className="absolute -right-8 -top-12 size-56 rounded-full border border-paper/10"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-16 size-72 rounded-full bg-gold/10 blur-2xl"
        />

        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
              Tu próximo intercambio
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.02] tracking-[-0.02em] sm:text-5xl">
              Menos organización.
              <br />
              Más regalos memorables.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-paper/70">
              Crea la sala hoy y comparte el link con tu grupo. El sorteo, las
              exclusiones y la privacidad corren por nuestra cuenta.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href={signedIn ? "/groups/new" : "/sign-up"}
              className={buttonStyles({
                variant: "gold",
                size: "lg",
                className: "whitespace-nowrap",
              })}
            >
              {signedIn ? "Crear una sala" : "Empezar ahora"}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            {!signedIn ? (
              <Link
                href="/sign-in"
                className={buttonStyles({
                  variant: "secondary",
                  size: "lg",
                  className:
                    "border-paper/20 bg-transparent text-paper hover:border-paper/40 hover:bg-paper/10",
                })}
              >
                Ingresar
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
