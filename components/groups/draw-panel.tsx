"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Mail,
  Shuffle,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { Group } from "@/lib/types";

interface DrawPanelProps {
  group: Group;
  memberCount: number;
  emailCount: number;
  exclusionsCount: number;
  onDrawn: () => void;
}

export function DrawPanel({
  group,
  memberCount,
  emailCount,
  exclusionsCount,
  onDrawn,
}: DrawPanelProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawing, setDrawing] = useState(false);

  const canDraw = memberCount >= 2;
  const deadlinePassed =
    Boolean(group.draw_at) && new Date(group.draw_at!).getTime() < Date.now();

  async function runDraw() {
    if (!canDraw) return;

    setDrawing(true);

    try {
      const response = await fetch(`/api/groups/${group.id}/draw`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        emailResult?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "No pudimos ejecutar el sorteo.");
      }

      setDialogOpen(false);
      toast({
        title: "Sorteo realizado",
        description:
          payload.emailResult?.message ??
          "Cada participante ya puede revelar su amigo secreto en privado.",
        variant: "success",
      });
      onDrawn();
    } catch (error) {
      toast({
        title: "No se pudo ejecutar el sorteo",
        description:
          error instanceof Error ? error.message : "Inténtalo de nuevo.",
        variant: "error",
      });
    } finally {
      setDrawing(false);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-pine/15 bg-paper shadow-soft">
        <div className="bg-pine px-5 py-5 text-paper sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-paper/10 text-gold">
              <Shuffle className="size-4" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-xl">Ejecutar sorteo</h2>
              <p className="text-[11px] text-paper/60">
                Solo el organizador puede hacerlo
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-muted">
                <Users className="size-4 text-pine" aria-hidden />
                Participantes
              </span>
              <span className="font-semibold text-ink">{memberCount}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-muted">
                <XCircle className="size-4 text-pine" aria-hidden />
                Exclusiones
              </span>
              <span className="font-semibold text-ink">{exclusionsCount}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-muted">
                <Mail className="size-4 text-pine" aria-hidden />
                Correos
              </span>
              <span className="text-right text-xs font-semibold text-ink">
                {group.send_emails
                  ? `${emailCount} al finalizar`
                  : "Desactivados"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-muted">
                <CalendarClock className="size-4 text-pine" aria-hidden />
                Fecha límite
              </span>
              <span className="text-xs font-semibold text-ink">
                {group.draw_at
                  ? new Intl.DateTimeFormat("es-MX", {
                      day: "numeric",
                      month: "short",
                    }).format(new Date(group.draw_at))
                  : "Sin definir"}
              </span>
            </li>
          </ul>

          {deadlinePassed ? (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-gold/30 bg-gold/10 p-3">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0 text-[#8a641f]"
                aria-hidden
              />
              <p className="text-[11px] leading-relaxed text-[#7a571a]">
                La fecha límite ya pasó, pero aún puedes ejecutar el sorteo si
                todos están dentro.
              </p>
            </div>
          ) : null}

          {!canDraw ? (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-line bg-cream/60 p-3">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0 text-muted"
                aria-hidden
              />
              <p className="text-[11px] leading-relaxed text-muted">
                Necesitas al menos 2 participantes para ejecutar el sorteo.
              </p>
            </div>
          ) : null}

          <Button
            type="button"
            className="mt-5 w-full"
            size="lg"
            disabled={!canDraw}
            onClick={() => setDialogOpen(true)}
          >
            <Shuffle className="size-4" aria-hidden />
            Ejecutar sorteo
          </Button>

          <p className="mt-3 text-center text-[10px] leading-relaxed text-muted">
            Esta acción es definitiva. Después del sorteo, la lista se cierra.
          </p>
        </div>
      </section>

      <ConfirmDialog
        open={dialogOpen}
        title="¿Ejecutar el sorteo?"
        description={
          group.send_emails
            ? `Se asignará un amigo secreto a cada uno de los ${memberCount} participantes respetando ${exclusionsCount} ${
                exclusionsCount === 1 ? "exclusión" : "exclusiones"
              }. Después enviaremos ${emailCount} correos de notificación y no se podrá deshacer.`
            : `Se asignará un amigo secreto a cada uno de los ${memberCount} participantes respetando ${exclusionsCount} ${
                exclusionsCount === 1 ? "exclusión" : "exclusiones"
              }. No se enviarán correos y la acción no se puede deshacer.`
        }
        confirmLabel="Sí, ejecutar sorteo"
        cancelLabel="Todavía no"
        loading={drawing}
        icon={<Shuffle className="size-5" />}
        onConfirm={() => void runDraw()}
        onClose={() => {
          if (!drawing) setDialogOpen(false);
        }}
      />
    </>
  );
}
