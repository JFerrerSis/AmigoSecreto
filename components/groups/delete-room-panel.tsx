"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import type { Group } from "@/lib/types";

export function DeleteRoomPanel({
  group,
  userId,
}: {
  group: Group;
  userId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function clearLocalCaches() {
    try {
      window.localStorage.removeItem(
        `amigo-secreto:group:${group.id}:${userId}`,
      );
      window.localStorage.removeItem(`amigo-secreto:dashboard:${userId}`);
    } catch {
      return;
    }
  }

  async function handleDelete() {
    setDeleting(true);

    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "No pudimos eliminar la sala.");
      }

      clearLocalCaches();
      setOpen(false);
      toast({
        title: "Sala eliminada",
        description: `"${group.name}" y todos sus datos se borraron.`,
        variant: "success",
      });
      router.replace("/dashboard");
    } catch (error) {
      toast({
        title: "No se pudo eliminar la sala",
        description:
          error instanceof Error ? error.message : "Inténtalo de nuevo.",
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  }

  const description =
    group.status === "completed"
      ? `Se eliminará "${group.name}" junto con sus participantes, exclusiones y resultados del sorteo. Esta acción no se puede deshacer.`
      : `Se eliminará "${group.name}" junto con sus participantes y exclusiones. Esta acción no se puede deshacer.`;

  return (
    <>
      <Card className="border-terra/20 bg-terra/5 p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-terra/10 text-terra-deep">
            <Trash2 className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Eliminar sala</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Borra la sala y todos sus datos. Solo el organizador puede hacerlo.
            </p>
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="mt-4"
              onClick={() => setOpen(true)}
            >
              <Trash2 className="size-4" aria-hidden />
              Eliminar sala
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={open}
        title="¿Eliminar esta sala?"
        description={description}
        confirmLabel="Sí, eliminar sala"
        cancelLabel="Cancelar"
        loading={deleting}
        tone="danger"
        icon={<Trash2 className="size-5" />}
        onConfirm={() => void handleDelete()}
        onClose={() => {
          if (!deleting) setOpen(false);
        }}
      />
    </>
  );
}
