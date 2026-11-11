"use client";

import { useEffect, useState } from "react";
import { Gift, LockKeyhole, Sparkles } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import type { Group, GroupMember } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface RevealCardProps {
  group: Group;
  receiver: GroupMember;
  userId: string;
}

function budgetLabel(group: Group) {
  if (Number(group.min_budget) === Number(group.max_budget)) {
    return formatCurrency(group.min_budget, group.currency);
  }

  return `${formatCurrency(group.min_budget, group.currency)} – ${formatCurrency(
    group.max_budget,
    group.currency,
  )}`;
}

export function RevealCard({ group, receiver, userId }: RevealCardProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(
      `revealed:${group.id}:${userId}`,
    );

    if (stored === "1") setRevealed(true);
  }, [group.id, userId]);

  async function handleReveal() {
    setRevealed(true);
    window.sessionStorage.setItem(`revealed:${group.id}:${userId}`, "1");

    const { default: confetti } = await import("canvas-confetti");
    void confetti({
      particleCount: 110,
      spread: 78,
      startVelocity: 38,
      origin: { y: 0.62 },
      colors: ["#2f5d50", "#dfb473", "#c96f4a", "#fffdf8"],
      disableForReducedMotion: true,
      scalar: 0.9,
    });
  }

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={handleReveal}
        className="group relative w-full overflow-hidden rounded-4xl bg-pine p-7 text-left text-paper shadow-float transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:p-10"
      >
        <div
          aria-hidden
          className="absolute -right-16 -top-20 size-64 rounded-full border border-paper/10 transition-transform duration-500 group-hover:scale-110"
        />
        <div
          aria-hidden
          className="absolute -right-4 -top-8 size-40 rounded-full border border-paper/10"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-16 size-64 rounded-full bg-gold/10 blur-2xl"
        />

        <div className="relative flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/20 bg-paper/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
            <LockKeyhole className="size-3" aria-hidden />
            Solo para ti
          </span>
          <span className="font-display text-lg italic text-paper/60">
            {group.currency}
          </span>
        </div>

        <div className="relative mt-8 flex flex-col items-center text-center">
          <span className="flex size-24 items-center justify-center rounded-full border border-dashed border-paper/30 bg-paper/5">
            <span className="flex size-16 items-center justify-center rounded-full bg-gold text-ink shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-6">
              <Gift className="size-7" strokeWidth={1.7} aria-hidden />
            </span>
          </span>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-paper/55">
            Tu amigo secreto está listo
          </p>
          <h2 className="mt-2 font-display text-4xl leading-[1.02] tracking-[-0.02em] sm:text-5xl">
            ¿Te atreves a verlo?
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/65">
            El resultado es privado y solo se muestra en tu sesión. Nadie más
            puede verlo, ni siquiera el organizador.
          </p>

          <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-ink transition-all duration-300 group-hover:bg-gold-deep group-hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)]">
            <Sparkles className="size-4" aria-hidden />
            Haz clic para revelar
          </span>
        </div>
      </button>
    );
  }

  return (
    <section className="animate-rise overflow-hidden rounded-4xl border border-line bg-paper shadow-soft">
      <div className="relative overflow-hidden bg-cream/70 px-6 pb-8 pt-10 text-center sm:px-10">
        <div
          aria-hidden
          className="absolute -right-12 -top-16 size-44 rounded-full bg-gold/20 blur-2xl"
        />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-pine">
          Te toca regalarle a
        </p>
        <div className="relative mx-auto mt-5 w-fit">
          <span
            aria-hidden
            className="absolute inset-0 -m-2 rounded-full bg-gold/20"
          />
          <Avatar
            name={receiver.full_name}
            src={receiver.avatar_url}
            size="xl"
            className="relative border-4 border-paper shadow-lift"
          />
        </div>
        <h2 className="relative mt-4 font-display text-4xl leading-[1.02] tracking-[-0.02em] text-ink sm:text-5xl">
          {receiver.full_name}
        </h2>
        <div className="relative mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-bold text-ink shadow-soft">
          <Gift className="size-4 text-terra" aria-hidden />
          {budgetLabel(group)}
        </div>
        <p className="relative mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
          Ya puedes empezar a pensar en su regalo. El presupuesto es una guía
          para que todos jueguen con las mismas reglas.
        </p>
      </div>

      <div className="flex items-start gap-3 border-t border-line bg-paper p-5 sm:px-8">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
          <LockKeyhole className="size-4" aria-hidden />
        </span>
        <p className="text-xs leading-relaxed text-muted">
          Esta tarjeta solo es visible para ti. Si cierras sesión, el resultado
          seguirá guardado y podrás volver a consultarlo cuando quieras.
        </p>
      </div>
    </section>
  );
}
