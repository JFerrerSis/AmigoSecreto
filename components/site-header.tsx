"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, LogOut, Plus } from "lucide-react";

import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useLocalUser } from "@/hooks/use-local-user";

export function SiteHeader() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, signOut } = useLocalUser();

  async function handleSignOut() {
    await signOut();
    toast({
      title: "Sesión cerrada",
      description: "Tus salas siguen guardadas para cuando vuelvas.",
      variant: "info",
    });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Logo />

        <nav className="hidden items-center gap-5 md:flex lg:gap-7" aria-label="Principal">
          <Link
            href="/#como-funciona"
            className="text-sm font-medium text-muted transition hover:text-ink"
          >
            Cómo funciona
          </Link>
          <Link
            href="/join"
            className="text-sm font-medium text-muted transition hover:text-ink"
          >
            Unirse
          </Link>
          <Link
            href="/privacidad"
            className="text-sm font-medium text-muted transition hover:text-ink"
          >
            Privacidad
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted transition hover:text-ink"
              >
                Mis salas
              </Link>
              <Link
                href="/perfil"
                className="text-sm font-medium text-muted transition hover:text-ink"
              >
                Mi perfil
              </Link>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <span className="h-9 w-28 animate-pulse rounded-full bg-sand" />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink transition hover:bg-sand sm:inline-flex"
              >
                <LayoutGrid className="size-4" aria-hidden />
                Mis salas
              </Link>
              <Link
                href="/groups/new"
                className={buttonStyles({
                  size: "sm",
                  className: "hidden sm:inline-flex",
                })}
              >
                <Plus className="size-4" aria-hidden />
                Nueva sala
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-2.5 text-sm font-semibold text-ink shadow-soft transition hover:border-pine/30"
                title="Ir a mis salas"
              >
                <Avatar name={user.full_name} size="sm" />
                <span className="hidden max-w-28 truncate sm:block">
                  {user.full_name.split(" ")[0]}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="rounded-full p-2.5 text-muted transition hover:bg-sand hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/30"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-full px-3 py-2 text-sm font-semibold text-ink transition hover:bg-sand sm:px-4"
              >
                Ingresar
              </Link>
              <Link
                href="/sign-up"
                className={buttonStyles({
                  size: "sm",
                  className: "hidden sm:inline-flex",
                })}
              >
                Crear cuenta
              </Link>
              <Link
                href="/sign-up"
                className={buttonStyles({ size: "sm", className: "sm:hidden" })}
              >
                Crear
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
