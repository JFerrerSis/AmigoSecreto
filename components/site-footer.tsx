import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 bg-cream">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Intercambios de regalos con sorteo justo, reglas claras y resultados
            privados.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-muted">
            <LockKeyhole className="size-3.5 text-pine" aria-hidden />
            Privacidad por diseño
          </span>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Amigo Secreto
          </p>
          <div className="flex gap-5 text-xs font-medium text-muted">
            <Link href="/#como-funciona" className="transition hover:text-ink">
              Cómo funciona
            </Link>
            <Link href="/dashboard" className="transition hover:text-ink">
              Mis salas
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
