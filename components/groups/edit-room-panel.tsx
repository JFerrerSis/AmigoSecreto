"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Pencil, Users, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Card, InlineAlert } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { CURRENCIES } from "@/lib/currencies";
import type { Group } from "@/lib/types";
import { formatDateTimeLocal } from "@/lib/utils";

interface EditRoomPanelProps {
  group: Group;
  memberCount: number;
  onChanged?: () => void | Promise<void>;
}

interface FormState {
  name: string;
  minBudget: string;
  maxBudget: string;
  currency: string;
  maxParticipants: string;
  drawAt: string;
}

function nextFriday() {
  const date = new Date();
  date.setDate(date.getDate() + ((5 - date.getDay() + 7) % 7 || 7));
  date.setHours(20, 0, 0, 0);
  return date;
}

function initialState(group: Group): FormState {
  return {
    name: group.name,
    minBudget: String(group.min_budget),
    maxBudget: String(group.max_budget),
    currency: group.currency,
    maxParticipants: String(group.max_participants),
    drawAt: formatDateTimeLocal(
      group.draw_at ? new Date(group.draw_at) : nextFriday(),
    ),
  };
}

export function EditRoomPanel({
  group,
  memberCount,
  onChanged,
}: EditRoomPanelProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => initialState(group));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialState(group));
      setError("");
    }
  }, [group, open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function handleSave() {
    const minBudget = Number(form.minBudget);
    const maxBudget = Number(form.maxBudget);
    const maxParticipants = Number(form.maxParticipants);
    const drawDate = new Date(form.drawAt);

    if (form.name.trim().length < 3) {
      setError("Ponle un nombre de al menos 3 caracteres.");
      return;
    }

    if (Number.isNaN(minBudget) || minBudget < 0) {
      setError("Ingresa un monto mínimo válido.");
      return;
    }

    if (Number.isNaN(maxBudget) || maxBudget < minBudget) {
      setError("El máximo debe ser mayor o igual al mínimo.");
      return;
    }

    if (
      !Number.isInteger(maxParticipants) ||
      maxParticipants < memberCount ||
      maxParticipants > 100
    ) {
      setError(
        `Elige un cupo entre ${memberCount} y 100 personas. Ya hay ${memberCount} en la sala.`,
      );
      return;
    }

    if (!form.drawAt || Number.isNaN(drawDate.getTime())) {
      setError("Selecciona una fecha y hora válidas.");
      return;
    }

    if (drawDate.getTime() <= Date.now()) {
      setError("La fecha límite debe estar en el futuro.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: form.name.trim(),
          minBudget,
          maxBudget,
          currency: form.currency,
          maxParticipants,
          drawAt: drawDate.toISOString(),
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "No pudimos guardar los cambios.");
      }

      toast({
        title: "Sala actualizada",
        description: "Los cambios ya son visibles para todos los participantes.",
        variant: "success",
      });
      setOpen(false);
      await onChanged?.();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar los cambios.",
      );
    } finally {
      setSaving(false);
    }
  }

  const legacyCurrency = !CURRENCIES.some(
    (currency) => currency.code === group.currency,
  );

  return (
    <>
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
            <Pencil className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Editar sala</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Cambia el nombre, presupuesto, cupo o fecha antes del sorteo.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => setOpen(true)}
            >
              <Pencil className="size-4" aria-hidden />
              Editar detalles
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={open}
        title="Editar sala"
        description="Solo el organizador puede editar la sala y solo antes de ejecutar el sorteo."
        confirmLabel="Guardar cambios"
        cancelLabel="Cancelar"
        loading={saving}
        icon={<Pencil className="size-5" />}
        onConfirm={() => void handleSave()}
        onClose={() => {
          if (!saving) setOpen(false);
        }}
      >
        <div className="space-y-4">
          <Field htmlFor="edit-name" label="Nombre de la sala">
            <Input
              id="edit-name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              maxLength={80}
              autoComplete="off"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field htmlFor="edit-minBudget" label="Mínimo">
              <Input
                id="edit-minBudget"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={form.minBudget}
                onChange={(event) => update("minBudget", event.target.value)}
              />
            </Field>
            <Field htmlFor="edit-maxBudget" label="Máximo">
              <Input
                id="edit-maxBudget"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={form.maxBudget}
                onChange={(event) => update("maxBudget", event.target.value)}
              />
            </Field>
            <Field htmlFor="edit-currency" label="Moneda">
              <Select
                id="edit-currency"
                value={form.currency}
                onChange={(event) => update("currency", event.target.value)}
              >
                {legacyCurrency ? (
                  <option value={group.currency}>
                    {group.currency} (actual)
                  </option>
                ) : null}
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} — {currency.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              htmlFor="edit-maxParticipants"
              label="Cupo máximo"
              hint={`Ya hay ${memberCount} participantes.`}
            >
              <Input
                id="edit-maxParticipants"
                type="number"
                min={memberCount}
                max="100"
                step="1"
                inputMode="numeric"
                value={form.maxParticipants}
                onChange={(event) =>
                  update("maxParticipants", event.target.value)
                }
              />
            </Field>
            <Field htmlFor="edit-drawAt" label="Fecha límite">
              <Input
                id="edit-drawAt"
                type="datetime-local"
                value={form.drawAt}
                onChange={(event) => update("drawAt", event.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="size-3.5 text-pine" aria-hidden />
              Presupuesto
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5 text-pine" aria-hidden />
              Cupo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-pine" aria-hidden />
              Fecha
            </span>
          </div>

          {error ? (
            <InlineAlert variant="warning">
              <p>{error}</p>
            </InlineAlert>
          ) : null}
        </div>
      </ConfirmDialog>
    </>
  );
}
