import Link from "next/link";
import { Gift } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-72px)] w-full max-w-2xl items-center justify-center px-5 py-16">
      <Card className="w-full p-8 text-center sm:p-12">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-cream text-pine">
          <Gift className="size-6" aria-hidden />
        </span>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-pine">
          Error 404
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink">
          Este regalo no está aquí.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          La página que buscas no existe o cambió de lugar. Vuelve al inicio o
          entra a tus salas para seguir organizando.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className={buttonStyles()}>
            Volver al inicio
          </Link>
          <Link
            href="/dashboard"
            className={buttonStyles({ variant: "secondary" })}
          >
            Ir a mis salas
          </Link>
        </div>
      </Card>
    </div>
  );
}
