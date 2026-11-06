import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { CreateGroupForm } from "@/components/groups/create-group-form";

export const metadata: Metadata = {
  title: "Nueva sala",
};

export default function NewGroupPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-14">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-full py-1 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a mis salas
      </Link>

      <div className="mt-6 max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pine">
          Nueva sala
        </p>
        <h1 className="mt-2 font-display text-4xl leading-[1.02] tracking-[-0.02em] text-ink sm:text-5xl">
          Prepara el próximo intercambio.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Define el presupuesto y el cupo. Después comparte el link y ejecuta el
          sorteo cuando todos estén dentro.
        </p>
      </div>

      <div className="mt-10">
        <CreateGroupForm />
      </div>
    </div>
  );
}
