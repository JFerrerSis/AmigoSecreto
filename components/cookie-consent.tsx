"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Cookie } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "amigo-secreto-cookie-consent-v1";

export function CookieConsent() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isLegalPage =
    pathname === "/cookies" ||
    pathname === "/privacidad" ||
    pathname === "/terminos";

  const accept = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (isLegalPage) {
      setOpen(false);
      return;
    }

    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, [isLegalPage]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        accept();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [accept, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/45 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="w-full max-w-lg animate-rise rounded-4xl border border-line bg-paper p-6 shadow-float sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gold/20 text-[#7a571a]">
            <Cookie className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-pine">
              Cookies necesarias
            </p>
            <h2
              id="cookie-consent-title"
              className="mt-1 font-display text-3xl leading-tight text-ink"
            >
              Solo lo esencial
            </h2>
          </div>
        </div>

        <p
          id="cookie-consent-description"
          className="mt-4 text-sm leading-relaxed text-muted"
        >
          Usamos una cookie para mantener tu sesión iniciada y una copia
          temporal en tu navegador para que la app cargue más rápido. No usamos
          publicidad ni seguimiento.
        </p>

        <Button
          type="button"
          size="lg"
          className="mt-6 w-full"
          onClick={accept}
          autoFocus
        >
          Aceptar y continuar
        </Button>

        <p className="mt-3 text-center text-xs leading-relaxed text-muted">
          Puedes leer la{" "}
          <Link
            href="/cookies"
            className="font-semibold text-pine underline decoration-pine/30 underline-offset-2 transition hover:text-pine-deep"
          >
            política de cookies
          </Link>{" "}
          y la{" "}
          <Link
            href="/privacidad"
            className="font-semibold text-pine underline decoration-pine/30 underline-offset-2 transition hover:text-pine-deep"
          >
            política de privacidad
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
