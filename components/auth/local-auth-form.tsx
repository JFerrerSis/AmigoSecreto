"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, HardDrive, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useLocalUser } from "@/hooks/use-local-user";

export function LocalAuthForm({
  mode,
  redirectUrl,
}: {
  mode: "sign-in" | "sign-up";
  redirectUrl: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { saveProfile, saving } = useLocalUser();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const website = String(
      new FormData(event.currentTarget).get("website") ?? "",
    );

    if (isSignUp && cleanName.length < 2) {
      nextErrors.fullName = "Escribe tu nombre.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      nextErrors.email = "Escribe un correo válido.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      await saveProfile({
        intent: isSignUp ? "create" : "login",
        fullName: isSignUp ? cleanName : undefined,
        email: cleanEmail,
        website,
      });
      toast({
        title: isSignUp ? "Identidad creada" : "Bienvenido de vuelta",
        description: isSignUp
          ? "Ya puedes crear salas y participar en sorteos."
          : "Usamos tu identidad local existente. Ya estás dentro.",
        variant: "success",
      });
      router.replace(redirectUrl);
      router.refresh();
    } catch (error) {
      toast({
        title: "No pudimos guardar tu identidad",
        description:
          error instanceof Error ? error.message : "Inténtalo de nuevo.",
        variant: "error",
      });
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-pine/15 bg-pine/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-pine">
          <HardDrive className="size-3" aria-hidden />
          Identidad local · sesión firmada
        </span>
        <h1 className="mt-4 font-display text-4xl leading-tight text-ink">
          {isSignUp ? "Crea tu identidad local" : "Entra a tus salas"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {isSignUp
            ? "Tu nombre y correo se guardan en la base de datos privada del proyecto para identificar tus salas y resultados. No compartimos tus datos con terceros."
            : "Escribe el correo con el que creaste tu identidad. Si ya existe, entras directo sin volver a escribir tu nombre."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-line bg-paper p-6 shadow-soft sm:p-7"
      >
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <div className="space-y-5">
          {isSignUp ? (
            <Field
              htmlFor="fullName"
              label="Tu nombre"
              hint="Así te verán los demás participantes."
              error={errors.fullName}
            >
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setErrors((current) => ({ ...current, fullName: "" }));
                }}
                placeholder="Ana Martínez"
                autoComplete="name"
                maxLength={80}
                autoFocus
              />
            </Field>
          ) : null}

          <Field
            htmlFor="email"
            label="Correo"
            hint={
              isSignUp
                ? "Lo usaremos para identificar tu identidad en este proyecto."
                : "Si ya creaste tu identidad, este correo te hace entrar directo."
            }
            error={errors.email}
          >
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: "" }));
              }}
              placeholder="ana@ejemplo.com"
              autoComplete="email"
              maxLength={160}
              autoFocus={!isSignUp}
            />
          </Field>
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-6 w-full"
          loading={saving}
        >
          {isSignUp ? "Crear mi identidad" : "Ingresar"}
          <ArrowRight className="size-4" aria-hidden />
        </Button>

        <p className="mt-4 text-center text-xs text-muted">
          {isSignUp ? "¿Ya tienes identidad?" : "¿Todavía no tienes identidad?"}{" "}
          <Link
            href={`${isSignUp ? "/sign-in" : "/sign-up"}?redirect_url=${encodeURIComponent(
              redirectUrl,
            )}`}
            className="font-semibold text-pine transition hover:text-pine-deep"
          >
            {isSignUp ? "Ingresar" : "Crear una"}
          </Link>
        </p>

        <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-line bg-cream/60 p-3">
          <ShieldCheck
            className="mt-0.5 size-3.5 shrink-0 text-pine"
            aria-hidden
          />
          <p className="text-[11px] leading-relaxed text-muted">
            La sesión usa una cookie httpOnly firmada. Tus datos se guardan en
            la base de datos privada del proyecto y no se comparten con
            terceros.
          </p>
        </div>
      </form>
    </div>
  );
}
