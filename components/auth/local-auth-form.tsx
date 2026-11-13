"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Gift, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import {
  LocalRequestError,
  useLocalUser,
} from "@/hooks/use-local-user";

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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupMode, setSetupMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const isSignUp = mode === "sign-up";
  const needsPassword = isSignUp || setupMode;

  function clearError(field: string) {
    setErrors((current) => ({ ...current, [field]: "" }));
    setFormError("");
  }

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

    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(cleanEmail)) {
      nextErrors.email = "Escribe un correo válido.";
    }

    if (needsPassword) {
      if (password.length < 8) {
        nextErrors.password = "Usa al menos 8 caracteres.";
      }

      if (password !== confirmPassword) {
        nextErrors.confirmPassword = "Las contraseñas no coinciden.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const intent = setupMode ? "set-password" : isSignUp ? "create" : "login";

    try {
      await saveProfile({
        intent,
        fullName: isSignUp ? cleanName : undefined,
        email: cleanEmail,
        password: password || undefined,
        website,
      });
      toast({
        title: setupMode
          ? "Contraseña creada"
          : isSignUp
            ? "Cuenta creada"
            : "Bienvenido de vuelta",
        description:
          setupMode
            ? "Ya puedes entrar con tu correo y contraseña."
            : isSignUp
              ? "Ya puedes crear salas y participar en sorteos."
              : "Entraste a tu cuenta. Ya puedes ver tus salas.",
        variant: "success",
      });
      router.replace(redirectUrl);
      router.refresh();
    } catch (error) {
      if (error instanceof LocalRequestError) {
        if (error.code === "PASSWORD_SETUP_REQUIRED") {
          setSetupMode(true);
          setPassword("");
          setConfirmPassword("");
          setFormError(
            "Tu cuenta es anterior al acceso con contraseña. Crea una para continuar.",
          );
          return;
        }

        if (error.code === "PASSWORD_ALREADY_SET") {
          setSetupMode(false);
          setFormError("Esta cuenta ya tiene contraseña. Escribe la tuya.");
          return;
        }

        if (error.code === "INVALID_CREDENTIALS") {
          setFormError("Correo o contraseña incorrectos.");
          return;
        }

        if (error.code === "USER_NOT_FOUND") {
          setFormError("No encontramos una cuenta con ese correo.");
          return;
        }

        if (error.code === "EMAIL_ALREADY_EXISTS") {
          setFormError("Ya existe una cuenta con ese correo. Inicia sesión.");
          return;
        }
      }

      toast({
        title: "No pudimos guardar tus datos",
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
          <Gift className="size-3" aria-hidden />
          Organiza sin enredos
        </span>
        <h1 className="mt-4 font-display text-4xl leading-tight text-ink">
          {setupMode
            ? "Crea tu contraseña"
            : isSignUp
              ? "Crea tu cuenta"
              : "Entra a tus salas"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {setupMode
            ? "Tu cuenta ya existe. Agrega una contraseña para entrar sin depender de enlaces."
            : isSignUp
              ? "Tu nombre, correo y una contraseña mantienen tus salas y resultados asociados a ti."
              : "Entra con tu correo y contraseña."}
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

        {formError ? (
          <InlineAlert variant="warning" className="mb-5">
            <p>{formError}</p>
          </InlineAlert>
        ) : null}

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
                  clearError("fullName");
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
                ? "Lo usaremos para reconocerte cuando vuelvas."
                : "Usa el mismo correo con el que creaste tu cuenta."
            }
            error={errors.email}
          >
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearError("email");
              }}
              placeholder="ana@ejemplo.com"
              autoComplete="email"
              maxLength={254}
              autoFocus={!isSignUp}
            />
          </Field>

          {!setupMode && !isSignUp ? (
            <Field
              htmlFor="password"
              label="Contraseña"
              hint="Déjala vacía solo si tu cuenta es anterior y aún no tiene contraseña."
              error={errors.password}
            >
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearError("password");
                }}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                maxLength={72}
              />
            </Field>
          ) : (
            <>
              <Field
                htmlFor="password"
                label="Contraseña"
                hint="Usa al menos 8 caracteres."
                error={errors.password}
              >
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearError("password");
                  }}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  maxLength={72}
                />
              </Field>

              <Field
                htmlFor="confirmPassword"
                label="Confirma tu contraseña"
                error={errors.confirmPassword}
              >
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    clearError("confirmPassword");
                  }}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  maxLength={72}
                />
              </Field>
            </>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-6 w-full"
          loading={saving}
        >
          {setupMode
            ? "Crear contraseña y entrar"
            : isSignUp
              ? "Crear mi cuenta"
              : "Ingresar"}
          <ArrowRight className="size-4" aria-hidden />
        </Button>

        <p className="mt-4 text-center text-xs text-muted">
          {isSignUp ? "¿Ya tienes cuenta?" : "¿Todavía no tienes cuenta?"}{" "}
          <Link
            href={`${isSignUp ? "/sign-in" : "/sign-up"}?redirect_url=${encodeURIComponent(
              redirectUrl,
            )}`}
            className="font-semibold text-pine transition hover:text-pine-deep"
          >
            {isSignUp ? "Ingresar" : "Crear una cuenta"}
          </Link>
        </p>

        <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-line bg-cream/60 p-3">
          <ShieldCheck
            className="mt-0.5 size-3.5 shrink-0 text-pine"
            aria-hidden
          />
          <p className="text-[11px] leading-relaxed text-muted">
            Al continuar, aceptas los{" "}
            <Link
              href="/terminos"
              className="font-semibold text-pine underline decoration-pine/30 underline-offset-2 transition hover:text-pine-deep"
            >
              Términos de uso
            </Link>{" "}
            y la{" "}
            <Link
              href="/privacidad"
              className="font-semibold text-pine underline decoration-pine/30 underline-offset-2 transition hover:text-pine-deep"
            >
              Política de privacidad
            </Link>
            . Usamos cookies necesarias para mantener tu sesión; puedes leer la{" "}
            <Link
              href="/cookies"
              className="font-semibold text-pine underline decoration-pine/30 underline-offset-2 transition hover:text-pine-deep"
            >
              política de cookies
            </Link>
            .
          </p>
        </div>
      </form>
    </div>
  );
}
