"use client";

import { useMemo, useState } from "react";
import { HeartOff, Plus, ShieldCheck, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { Exclusion, GroupMember } from "@/lib/types";

interface ExclusionsManagerProps {
  groupId: string;
  members: GroupMember[];
  exclusions: Exclusion[];
  onChanged: () => void;
}

export function ExclusionsManager({
  groupId,
  members,
  exclusions,
  onChanged,
}: ExclusionsManagerProps) {
  const { toast } = useToast();
  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.user_id, member])),
    [members],
  );

  const existingKeys = useMemo(
    () =>
      new Set(
        exclusions.map((exclusion) =>
          [exclusion.user_id_1, exclusion.user_id_2].sort().join("::"),
        ),
      ),
    [exclusions],
  );

  const selectedKey =
    firstId && secondId ? [firstId, secondId].sort().join("::") : "";
  const isDuplicate = selectedKey ? existingKeys.has(selectedKey) : false;
  const canAdd =
    Boolean(firstId) &&
    Boolean(secondId) &&
    firstId !== secondId &&
    !isDuplicate &&
    !saving;

  async function addExclusion() {
    if (!canAdd) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/exclusions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userA: firstId, userB: secondId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo bloquear la pareja.");
      }

      toast({
        title: "Pareja bloqueada",
        description: "No podrán asignarse entre sí en el sorteo.",
        variant: "success",
      });
      setFirstId("");
      setSecondId("");
      onChanged();
    } catch (error) {
      toast({
        title: "No se pudo bloquear la pareja",
        description:
          error instanceof Error ? error.message : "Inténtalo de nuevo.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeExclusion(id: string) {
    setRemovingId(id);

    try {
      const response = await fetch(`/api/groups/${groupId}/exclusions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exclusionId: id }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo quitar la regla.");
      }

      toast({
        title: "Regla eliminada",
        description: "La pareja vuelve a poder asignarse entre sí.",
        variant: "success",
      });
      onChanged();
    } catch (error) {
      toast({
        title: "No se pudo quitar la regla",
        description:
          error instanceof Error ? error.message : "Inténtalo de nuevo.",
        variant: "error",
      });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-paper shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-terra/10 text-terra-deep">
            <HeartOff className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-xl text-ink">
              Reglas de exclusión
            </h2>
            <p className="text-[11px] font-medium text-muted">
              Parejas que no pueden regalarse entre sí
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
          <ShieldCheck className="size-3 text-pine" aria-hidden />
          Solo organizador
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {members.length < 2 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-line bg-cream/50 p-4">
            <Users className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <p className="text-xs leading-relaxed text-muted">
              Necesitas al menos dos participantes para configurar exclusiones.
              Comparte el link de invitación y vuelve cuando se unan.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
              <Select
                value={firstId}
                onChange={(event) => setFirstId(event.target.value)}
                aria-label="Primer participante"
              >
                <option value="">Participante A</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.full_name}
                  </option>
                ))}
              </Select>

              <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-muted sm:block">
                con
              </span>

              <Select
                value={secondId}
                onChange={(event) => setSecondId(event.target.value)}
                aria-label="Segundo participante"
              >
                <option value="">Participante B</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.full_name}
                  </option>
                ))}
              </Select>

              <Button
                type="button"
                variant="secondary"
                onClick={() => void addExclusion()}
                disabled={!canAdd}
                loading={saving}
              >
                <Plus className="size-4" aria-hidden />
                Bloquear
              </Button>
            </div>

            {firstId && secondId && firstId === secondId ? (
              <p className="mt-2 text-xs font-medium text-terra-deep">
                Elige dos personas distintas.
              </p>
            ) : isDuplicate ? (
              <p className="mt-2 text-xs font-medium text-terra-deep">
                Esta pareja ya está bloqueada.
              </p>
            ) : null}

            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                Parejas bloqueadas · {exclusions.length}
              </p>

              {exclusions.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-line bg-cream/40 px-4 py-5 text-center">
                  <p className="text-xs leading-relaxed text-muted">
                    Sin exclusiones por ahora. El sorteo puede asignar a
                    cualquier pareja del grupo.
                  </p>
                </div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {exclusions.map((exclusion) => {
                    const memberA = memberById.get(exclusion.user_id_1);
                    const memberB = memberById.get(exclusion.user_id_2);

                    if (!memberA || !memberB) return null;

                    return (
                      <li
                        key={exclusion.id}
                        className="flex items-center gap-3 rounded-2xl border border-line bg-cream/40 px-3 py-2.5"
                      >
                        <div className="flex -space-x-2">
                          <Avatar
                            name={memberA.full_name}
                            src={memberA.avatar_url}
                            size="sm"
                            className="ring-2 ring-paper"
                          />
                          <Avatar
                            name={memberB.full_name}
                            src={memberB.avatar_url}
                            size="sm"
                            className="ring-2 ring-paper"
                          />
                        </div>
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                          {memberA.full_name}{" "}
                          <span className="font-normal text-muted">y</span>{" "}
                          {memberB.full_name}
                        </p>
                        <button
                          type="button"
                          onClick={() => void removeExclusion(exclusion.id)}
                          disabled={removingId === exclusion.id}
                          className="rounded-full p-2 text-muted transition hover:bg-terra/10 hover:text-terra-deep disabled:opacity-50"
                          aria-label={`Quitar exclusión entre ${memberA.full_name} y ${memberB.full_name}`}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
