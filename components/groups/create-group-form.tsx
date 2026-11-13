"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarClock,
  Info,
  Link2,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useLocalUser } from "@/hooks/use-local-user";
import { CURRENCIES } from "@/lib/currencies";
import type { CurrencyCode } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatDateTimeLocal,
} from "@/lib/utils";

interface FormState {
  name: string;
  minBudget: string;
  maxBudget: string;
  currency: CurrencyCode;
  maxParticipants: string;
  drawAt: string;
}

const initialState: FormState = {
  name: "",
  minBudget: "300",
  maxBudget: "800",
  currency: "MXN",
  maxParticipants: "10",
  drawAt: "",
};

export function CreateGroupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useLocalUser();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const nextFriday = new Date();
    nextFriday.setDate(
      nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7),
    );
    nextFriday.setHours(20, 0, 0, 0);

    setForm((current) =>
      current.drawAt
        ? current
        : { ...current, drawAt: formatDateTimeLocal(nextFriday) },
    );
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      toast({
        title: "Primero crea tu cuenta",
        description: "Solo necesitas tu nombre, correo y contraseña.",
        variant: "info",
      });
      router.push("/sign-in?redirect_url=/groups/new");
      return;
    }

    const nextErrors: Record<string, string> = {};
    const minBudget = Number(form.minBudget);
    const maxBudget = Number(form.maxBudget);
    const maxParticipants = Number(form.maxParticipants);
    const drawDate = new Date(form.drawAt);

    if (form.name.trim().length < 3) {
      nextErrors.name = "Ponle un nombre de al menos 3 caracteres.";
    }
    if (Number.isNaN(minBudget) || minBudget < 0) {
      nextErrors.minBudget = "Ingresa un monto mínimo válido.";
    }
    if (Number.isNaN(maxBudget) || maxBudget < minBudget) {
      nextErrors.maxBudget = "El máximo debe ser mayor o igual al mínimo.";
    }
    if (
      !Number.isInteger(maxParticipants) ||
      maxParticipants < 2 ||
      maxParticipants > 100
    ) {
      nextErrors.maxParticipants = "Elige un cupo entre 2 y 100 personas.";
    }
    if (!form.drawAt || Number.isNaN(drawDate.getTime())) {
      nextErrors.drawAt = "Selecciona una fecha y hora válidas.";
    } else if (drawDate.getTime() < Date.now()) {
      nextErrors.drawAt = "La fecha límite debe estar en el futuro.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast({
        title: "Revisa los campos",
        description: "Hay algunos datos que necesitan tu atención.",
        variant: "error",
      });
      return;
    }

    const website = String(
      new FormData(event.currentTarget).get("website") ?? "",
    );

    setSubmitting(true);

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          minBudget,
          maxBudget,
          currency: form.currency,
          maxParticipants,
          drawAt: drawDate.toISOString(),
          website,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        group?: { id: string; invite_code?: string };
      };

      if (!response.ok || !payload.group) {
        throw new Error(payload.error ?? "No pudimos crear la sala.");
      }

      toast({
        title: "Sala creada",
        description: payload.group.invite_code
          ? `Código de sala: ${payload.group.invite_code}. Compártelo o usa el link de invitación.`
          : "Ahora comparte el código o el link para que se unan tus invitados.",
        variant: "success",
      });
      router.push(`/groups/${payload.group.id}`);
    } catch (error) {
      toast({
        title: "No se pudo crear la sala",
        description:
          error instanceof Error ? error.message : "Inténtalo de nuevo.",
        variant: "error",
      });
      setSubmitting(false);
    }
  }

  const previewBudget = form.minBudget && form.maxBudget
    ? `${formatCurrency(Number(form.minBudget) || 0, form.currency)} – ${formatCurrency(
        Number(form.maxBudget) || 0,
        form.currency,
      )}`
    : "Define tu presupuesto";
  const previewDate =
    form.drawAt && !Number.isNaN(new Date(form.drawAt).getTime())
      ? formatDate(new Date(form.drawAt).toISOString())
      : "Elige una fecha";

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <section className="rounded-3xl border border-line bg-paper p-6 shadow-soft sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-pine/10 text-pine">
              <Wallet className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-2xl text-ink">Datos del evento</h2>
              <p className="text-xs text-muted">
                Lo esencial para que todos sepan qué esperar.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <Field
              htmlFor="name"
              label="Nombre de la sala"
              hint="Por ejemplo: Amigo Secreto Oficina 2026."
              error={errors.name}
            >
              <Input
                id="name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Amigo Secreto Oficina 2026"
                maxLength={80}
                autoComplete="off"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field
                htmlFor="minBudget"
                label="Monto mínimo"
                error={errors.minBudget}
              >
                <Input
                  id="minBudget"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  value={form.minBudget}
                  onChange={(event) => update("minBudget", event.target.value)}
                />
              </Field>
              <Field
                htmlFor="maxBudget"
                label="Monto máximo"
                error={errors.maxBudget}
              >
                <Input
                  id="maxBudget"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  value={form.maxBudget}
                  onChange={(event) => update("maxBudget", event.target.value)}
                />
              </Field>
              <Field htmlFor="currency" label="Moneda">
                <Select
                  id="currency"
                  value={form.currency}
                  onChange={(event) =>
                    update("currency", event.target.value as CurrencyCode)
                  }
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} · {currency.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                htmlFor="maxParticipants"
                label="Cupo máximo"
                hint="Incluye al organizador. Entre 2 y 100 personas."
                error={errors.maxParticipants}
              >
                <Input
                  id="maxParticipants"
                  type="number"
                  min="2"
                  max="100"
                  step="1"
                  inputMode="numeric"
                  value={form.maxParticipants}
                  onChange={(event) =>
                    update("maxParticipants", event.target.value)
                  }
                />
              </Field>
              <Field
                htmlFor="drawAt"
                label="Fecha límite"
                hint="El día del intercambio o el cierre de inscripciones."
                error={errors.drawAt}
              >
                <Input
                  id="drawAt"
                  type="datetime-local"
                  value={form.drawAt}
                  onChange={(event) => update("drawAt", event.target.value)}
                />
              </Field>
            </div>
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-2xl border border-pine/15 bg-pine/5 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-pine" aria-hidden />
          <p className="text-xs leading-relaxed text-muted">
            Las reglas de exclusión (parejas que no pueden regalarse) se
            configuran dentro de la sala, cuando ya se hayan unido los
            participantes. Las asignaciones se consultan dentro de la sala.
          </p>
        </div>

        <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs leading-relaxed text-muted">
            Podrás compartir el código y el link apenas crees la sala.
          </p>
          <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
            Crear sala
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </form>

      <aside className="lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-3xl border border-line bg-paper shadow-lift">
          <div className="relative overflow-hidden bg-pine px-6 py-7 text-paper">
            <div
              aria-hidden
              className="absolute -right-10 -top-12 size-40 rounded-full border border-paper/10"
            />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/20 bg-paper/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
              Vista previa
            </span>
            <h3 className="mt-5 line-clamp-2 font-display text-3xl leading-[1.05]">
              {form.name.trim() || "Tu amigo secreto"}
            </h3>
            <p className="mt-2 text-xs text-paper/60">Sala privada · 2026</p>
          </div>

          <div className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <Wallet className="mt-0.5 size-4 text-pine" aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Presupuesto
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {previewBudget}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarClock className="mt-0.5 size-4 text-pine" aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Fecha límite
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {previewDate}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 size-4 text-pine" aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Cupo
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {form.maxParticipants || "—"} participantes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Link2 className="mt-0.5 size-4 text-pine" aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Invitación
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  Código único al crear la sala
                </p>
              </div>
            </div>

          </div>
        </div>
      </aside>
    </div>
  );
}
