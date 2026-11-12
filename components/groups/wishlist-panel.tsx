"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import type { GroupMember, GroupWishlist } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WishlistPanelProps {
  groupId: string;
  members: GroupMember[];
  wishlists: GroupWishlist[];
  currentUserId: string;
  onChanged?: () => void | Promise<void>;
}

export function WishlistPanel({
  groupId,
  members,
  wishlists,
  currentUserId,
  onChanged,
}: WishlistPanelProps) {
  const { toast } = useToast();
  const ownWishlist = wishlists.find(
    (wishlist) => wishlist.user_id === currentUserId,
  );
  const [draft, setDraft] = useState(ownWishlist?.content ?? "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dirty) {
      setDraft(ownWishlist?.content ?? "");
    }
  }, [dirty, ownWishlist?.content]);

  const memberLists = useMemo(
    () =>
      members.map((member) => {
        const wishlist = wishlists.find(
          (item) => item.user_id === member.user_id,
        );
        const items = (wishlist?.content ?? "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);

        return { member, items };
      }),
    [members, wishlists],
  );

  async function handleSave() {
    if (!dirty) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/wishlist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ content: draft }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "No pudimos guardar tu lista.");
      }

      toast({
        title: "Lista actualizada",
        description: draft.trim()
          ? "Tus ideas ya están visibles para la sala."
          : "Tu lista quedó vacía.",
        variant: "success",
      });

      await onChanged?.();
      setDirty(false);
    } catch (saveError) {
      toast({
        title: "No pudimos guardar tu lista",
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

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gold/20 text-[#7a571a]">
            <Gift className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-xl text-ink">Listas de deseos</h2>
            <p className="text-[11px] font-medium text-muted">
              Ideas para tu regalo, una por línea.
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-line bg-cream/35 px-5 py-5 sm:px-6">
        <Field
          htmlFor="wishlist"
          label="Mi lista"
          hint="Solo tú puedes editar esta lista. Los demás participantes de la sala pueden verla."
        >
          <textarea
            id="wishlist"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setDirty(true);
            }}
            rows={4}
            maxLength={2000}
            placeholder={"Ej. Un libro de misterio\nUna taza artesanal\nAudífonos para música"}
            className="min-h-28 w-full resize-y rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-pine/40 focus:ring-2 focus:ring-pine/15"
          />
        </Field>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted">
            {draft.length} de 2000 caracteres
          </span>
          <Button
            type="button"
            size="sm"
            loading={saving}
            disabled={!dirty}
            onClick={() => void handleSave()}
          >
            Guardar mi lista
          </Button>
        </div>
      </div>

      <div className="divide-y divide-line/70">
        {memberLists.map(({ member, items }) => {
          const isCurrentUser = member.user_id === currentUserId;

          return (
            <div
              key={member.id}
              className={cn(
                "flex gap-3 px-5 py-4 sm:px-6",
                isCurrentUser && "bg-pine/[0.03]",
              )}
            >
              <Avatar
                name={member.full_name}
                src={member.avatar_url}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-ink">
                    {member.full_name}
                  </p>
                  {isCurrentUser ? (
                    <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-paper">
                      Tú
                    </span>
                  ) : null}
                </div>
                {items.length ? (
                  <ul className="mt-1.5 space-y-1">
                    {items.map((item, index) => (
                      <li
                        key={`${member.id}-${index}`}
                        className="flex gap-2 text-xs leading-relaxed text-muted"
                      >
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-gold-deep" />
                        <span className="break-words">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs italic text-muted">
                    Aún no agregó ideas.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
