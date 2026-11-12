"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, UserRound } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useLocalUser } from "@/hooks/use-local-user";
import { formatDate } from "@/lib/utils";

export function ProfileForm() {
  const { user, loading, refresh } = useLocalUser();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
    }
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = fullName.trim();

    if (cleanName.length < 2) {
      setError("Escribe tu nombre.");
      return;
    }

    if (cleanName.length > 80) {
      setError("El nombre es demasiado largo.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ fullName: cleanName }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "No pudimos guardar tu nombre.");
      }

      await refresh();
      toast({
        title: "Nombre actualizado",
        description: "Tu nombre se actualizó en todas tus salas.",
        variant: "success",
      });
    } catch (saveError) {
      toast({
        title: "No pudimos guardar tu nombre",
        description:
          saveError instanceof Error
            ? saveError.message
            : "Inténtalo de nuevo.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6 sm:p-8">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="mt-5 h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
        <Skeleton className="mt-8 h-12 w-full" />
        <Skeleton className="mt-4 h-12 w-full" />
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-8 text-center sm:p-12">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-pine/10 text-pine">
          <UserRound className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-4xl leading-tight text-ink">
          Entra para ver tu perfil.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Inicia sesión o crea tu cuenta para cambiar tu nombre.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/sign-in?redirect_url=/perfil"
            className={buttonStyles({ size: "lg" })}
          >
            Entrar
          </Link>
          <Link
            href="/sign-up?redirect_url=/perfil"
            className={buttonStyles({ variant: "secondary", size: "lg" })}
          >
            Crear cuenta
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Ir a mis salas
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <Avatar name={user.full_name} src={user.avatar_url} size="lg" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pine">
            Mi perfil
          </p>
          <h1 className="mt-1 font-display text-3xl leading-tight text-ink sm:text-4xl">
            {user.full_name}
          </h1>
          <p className="mt-1 text-xs text-muted">
            En Amigo Secreto desde {formatDate(user.created_at, false)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <Field
          htmlFor="fullName"
          label="Nombre"
          hint="Así te verán los demás participantes en todas tus salas."
          error={error}
        >
          <Input
            id="fullName"
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value);
              setError("");
            }}
            autoComplete="name"
            maxLength={80}
          />
        </Field>

        <Field
          htmlFor="email"
          label="Correo"
          hint="El correo no se puede cambiar desde aquí."
        >
          <Input
            id="email"
            type="email"
            value={user.email ?? ""}
            placeholder="Sin correo"
            disabled
            readOnly
          />
        </Field>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFullName(user.full_name);
              setError("");
            }}
            disabled={saving || fullName.trim() === user.full_name}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={saving}
            disabled={fullName.trim() === user.full_name}
          >
            Guardar cambios
          </Button>
        </div>
      </form>
    </Card>
  );
}
