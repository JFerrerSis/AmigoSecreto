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
          <p className="max-w-sm text-xs leading-relaxed text-muted">
            Usamos cookies necesarias para mantener tu sesión.{" "}
            <Link
              href="/cookies"
              className="font-semibold text-pine transition hover:text-pine-deep"
            >
              Más información
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-muted">
            <LockKeyhole className="size-3.5 text-pine" aria-hidden />
            Tus resultados, solo tuyos.
          </span>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Amigo Secreto
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted">
            <Link href="/#como-funciona" className="transition hover:text-ink">
              Cómo funciona
            </Link>
            <Link href="/dashboard" className="transition hover:text-ink">
              Mis salas
            </Link>
            <Link href="/join" className="transition hover:text-ink">
              Unirse con código
            </Link>
            <Link href="/perfil" className="transition hover:text-ink">
              Mi perfil
            </Link>
            <Link href="/terminos" className="transition hover:text-ink">
              Términos de uso
            </Link>
            <Link href="/privacidad" className="transition hover:text-ink">
              Privacidad
            </Link>
            <Link href="/cookies" className="transition hover:text-ink">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
