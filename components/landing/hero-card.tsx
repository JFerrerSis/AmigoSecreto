import { Gift, ShieldCheck, Sparkles, Wallet } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";

export function HeroCard() {
  return (
    <div
      className="relative mx-auto w-full max-w-[430px] animate-rise"
      style={{ animationDelay: "140ms" }}
    >
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[4rem] bg-gold/20 blur-3xl"
      />

      <div className="absolute -right-3 top-10 z-20 hidden animate-float-slow items-center gap-2.5 rounded-2xl border border-line bg-paper/95 px-3.5 py-3 shadow-lift backdrop-blur sm:flex">
        <span className="flex size-8 items-center justify-center rounded-xl bg-pine/10 text-pine">
          <Wallet className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            Presupuesto
          </p>
          <p className="text-sm font-bold text-ink">$500 – $800</p>
        </div>
      </div>

      <div className="absolute -left-4 bottom-16 z-20 hidden animate-float-slow items-center gap-2 rounded-full border border-line bg-paper/95 px-4 py-2.5 shadow-lift backdrop-blur sm:flex [animation-delay:1.5s]">
        <ShieldCheck className="size-4 text-pine" aria-hidden />
        <span className="text-xs font-semibold text-ink">Sorteo justo</span>
      </div>

      <div className="relative rotate-[-1.5deg] rounded-5xl border border-line bg-paper p-4 shadow-float">
        <div className="relative overflow-hidden rounded-4xl bg-pine px-6 pb-6 pt-7 text-paper">
          <div
            aria-hidden
            className="absolute -right-14 -top-16 size-48 rounded-full border border-paper/10"
          />
          <div
            aria-hidden
            className="absolute -right-6 -top-8 size-32 rounded-full border border-paper/10"
          />

          <div className="relative flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/20 bg-paper/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
              <Sparkles className="size-3" aria-hidden />
              Sala privada
            </span>
            <span className="font-display text-lg italic text-paper/70">2026</span>
          </div>

          <div className="relative mx-auto mt-7 flex size-24 items-center justify-center rounded-full border border-dashed border-paper/30 bg-paper/5">
            <span className="flex size-16 items-center justify-center rounded-full bg-gold text-ink shadow-[0_12px_30px_-12px_rgba(0,0,0,0.55)]">
              <Gift className="size-7" strokeWidth={1.7} aria-hidden />
            </span>
          </div>

          <div className="relative mt-6 text-center">
            <h3 className="font-display text-[28px] leading-[1.1] tracking-[-0.01em]">
              Tu amigo secreto
              <br />
              está listo
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-paper/65">
              Solo tú puedes ver este resultado.
            </p>
          </div>

          <div className="relative mt-6 rounded-2xl border border-dashed border-paper/25 bg-paper/10 px-4 py-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-paper/60">
              Haz clic para revelar
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-3xl border border-dashed border-line bg-cream/60 p-4">
          <Avatar name="Ana García" size="lg" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Te toca regalarle a
            </p>
            <p className="mt-0.5 truncate font-display text-2xl text-ink">
              Ana García
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-pine/10 px-3 py-1.5 text-xs font-bold text-pine-deep">
            $500 – $800
          </span>
        </div>
      </div>

      <div
        aria-hidden
        className="absolute -bottom-6 right-10 size-3 rounded-full bg-terra/70"
      />
      <div
        aria-hidden
        className="absolute -left-8 top-28 size-2 rounded-full bg-gold"
      />
      <div
        aria-hidden
        className="absolute -right-6 bottom-32 size-2 rounded-full bg-pine/50"
      />
    </div>
  );
}
