"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Gift,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Card, InlineAlert } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import type {
  GroupMember,
  GroupWishlist,
  GroupWishlistItem,
  WishlistPriority,
} from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

interface WishlistPanelProps {
  groupId: string;
  currency: string;
  members: GroupMember[];
  wishlists: GroupWishlist[];
  wishlistItems: GroupWishlistItem[];
  currentUserId: string;
  onChanged?: () => void | Promise<void>;
}

interface ItemFormState {
  title: string;
  url: string;
  price: string;
  notes: string;
  priority: WishlistPriority;
}

const EMPTY_ITEM: ItemFormState = {
  title: "",
  url: "",
  price: "",
  notes: "",
  priority: "medium",
};

const PRIORITY_META: Record<
  WishlistPriority,
  { label: string; className: string; rank: number }
> = {
  high: {
    label: "Alta",
    className: "border-terra/25 bg-terra/10 text-terra-deep",
    rank: 0,
  },
  medium: {
    label: "Media",
    className: "border-gold/30 bg-gold/15 text-[#7a571a]",
    rank: 1,
  },
  low: {
    label: "Baja",
    className: "border-pine/15 bg-pine/5 text-pine-deep",
    rank: 2,
  },
};

function itemLinkLabel(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Ver enlace";
  }
}

export function WishlistPanel({
  groupId,
  currency,
  members,
  wishlists,
  wishlistItems,
  currentUserId,
  onChanged,
}: WishlistPanelProps) {
  const { toast } = useToast();
  const ownWishlist = wishlists.find(
    (wishlist) => wishlist.user_id === currentUserId,
  );
  const ownItems = useMemo(
    () =>
      wishlistItems.filter((item) => item.user_id === currentUserId),
    [currentUserId, wishlistItems],
  );
  const [draft, setDraft] = useState(ownWishlist?.content ?? "");
  const [dirty, setDirty] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM);
  const [itemError, setItemError] = useState("");
  const [itemSaving, setItemSaving] = useState(false);
  const [pendingDelete, setPendingDelete] =
    useState<GroupWishlistItem | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        const items = wishlistItems
          .filter((item) => item.user_id === member.user_id)
          .sort((a, b) => {
            const priority =
              PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank;

            if (priority !== 0) return priority;

            return a.created_at.localeCompare(b.created_at);
          });

        return {
          member,
          items,
          notes: wishlist?.content.trim() ?? "",
        };
      }),
    [members, wishlistItems, wishlists],
  );

  function openCreate() {
    setEditingId(null);
    setItemForm(EMPTY_ITEM);
    setItemError("");
    setFormOpen(true);
  }

  function openEdit(item: GroupWishlistItem) {
    setEditingId(item.id);
    setItemForm({
      title: item.title,
      url: item.url ?? "",
      price: item.price === null ? "" : String(item.price),
      notes: item.notes ?? "",
      priority: item.priority,
    });
    setItemError("");
    setFormOpen(true);
  }

  function closeItemForm() {
    setFormOpen(false);
    setEditingId(null);
    setItemForm(EMPTY_ITEM);
    setItemError("");
  }

  function updateItem<K extends keyof ItemFormState>(
    key: K,
    value: ItemFormState[K],
  ) {
    setItemForm((current) => ({ ...current, [key]: value }));
    setItemError("");
  }

  async function handleSaveItem() {
    if (!itemForm.title.trim()) {
      setItemError("Escribe el nombre del regalo.");
      return;
    }

    if (itemForm.url.trim()) {
      try {
        const url = new URL(itemForm.url.trim());

        if (url.protocol !== "http:" && url.protocol !== "https:") {
          throw new Error();
        }
      } catch {
        setItemError("Escribe un enlace que empiece con http:// o https://.");
        return;
      }
    }

    if (itemForm.price.trim()) {
      const price = Number(itemForm.price);

      if (!Number.isFinite(price) || price < 0) {
        setItemError("Escribe un precio válido.");
        return;
      }
    }

    setItemSaving(true);
    setItemError("");

    try {
      const response = await fetch(
        editingId
          ? `/api/groups/${groupId}/wishlist/items/${editingId}`
          : `/api/groups/${groupId}/wishlist/items`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            title: itemForm.title.trim(),
            url: itemForm.url.trim(),
            price: itemForm.price.trim(),
            notes: itemForm.notes.trim(),
            priority: itemForm.priority,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "No pudimos guardar el regalo.");
      }

      toast({
        title: editingId ? "Regalo actualizado" : "Regalo agregado",
        description: "Tu lista ya está visible para la sala.",
        variant: "success",
      });
      closeItemForm();
      await onChanged?.();
    } catch (saveError) {
      setItemError(
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar el regalo.",
      );
    } finally {
      setItemSaving(false);
    }
  }

  async function handleDeleteItem() {
    if (!pendingDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/groups/${groupId}/wishlist/items/${pendingDelete.id}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "No pudimos eliminar el regalo.");
      }

      toast({
        title: "Regalo eliminado",
        description: "Tu lista se actualizó para la sala.",
        variant: "success",
      });
      setPendingDelete(null);

      if (editingId === pendingDelete.id) {
        closeItemForm();
      }

      await onChanged?.();
    } catch (deleteError) {
      toast({
        title: "No pudimos eliminar el regalo",
        description:
          deleteError instanceof Error
            ? deleteError.message
            : "Inténtalo de nuevo.",
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveNotes() {
    if (!dirty) return;

    setSavingNotes(true);

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
        throw new Error(payload?.error ?? "No pudimos guardar tus notas.");
      }

      toast({
        title: "Notas actualizadas",
        description: "Tus notas ya están visibles para la sala.",
        variant: "success",
      });
      setDirty(false);
      await onChanged?.();
    } catch (saveError) {
      toast({
        title: "No pudimos guardar tus notas",
        description:
          saveError instanceof Error
            ? saveError.message
            : "Inténtalo de nuevo.",
        variant: "error",
      });
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gold/20 text-[#7a571a]">
              <Gift className="size-4" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-xl text-ink">
                Listas de deseos
              </h2>
              <p className="text-[11px] font-medium text-muted">
                Regalos concretos y notas para inspirar.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-muted">
            {ownItems.length} de 30 regalos
          </span>
        </div>

        <div className="border-b border-line bg-cream/35 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Mi lista</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                Tú decides qué agregar. Los demás participantes pueden verlo.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant={formOpen ? "secondary" : "primary"}
              onClick={() => {
                if (formOpen) {
                  closeItemForm();
                } else {
                  openCreate();
                }
              }}
            >
              {formOpen ? (
                <>
                  <X className="size-4" aria-hidden />
                  Cerrar
                </>
              ) : (
                <>
                  <Plus className="size-4" aria-hidden />
                  Agregar regalo
                </>
              )}
            </Button>
          </div>

          {formOpen ? (
            <div className="mt-4 rounded-2xl border border-line bg-paper p-4">
              <div className="space-y-4">
                <Field htmlFor="wishlist-title" label="Regalo">
                  <Input
                    id="wishlist-title"
                    value={itemForm.title}
                    onChange={(event) =>
                      updateItem("title", event.target.value)
                    }
                    placeholder="Ej. Libro de misterio"
                    maxLength={120}
                    autoComplete="off"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    htmlFor="wishlist-url"
                    label="Enlace"
                    optional
                  >
                    <Input
                      id="wishlist-url"
                      type="url"
                      value={itemForm.url}
                      onChange={(event) =>
                        updateItem("url", event.target.value)
                      }
                      placeholder="https://..."
                      maxLength={500}
                      autoComplete="off"
                    />
                  </Field>
                  <Field htmlFor="wishlist-price" label="Precio" optional>
                    <Input
                      id="wishlist-price"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={itemForm.price}
                      onChange={(event) =>
                        updateItem("price", event.target.value)
                      }
                      placeholder="Opcional"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field htmlFor="wishlist-priority" label="Prioridad">
                    <Select
                      id="wishlist-priority"
                      value={itemForm.priority}
                      onChange={(event) =>
                        updateItem(
                          "priority",
                          event.target.value as WishlistPriority,
                        )
                      }
                    >
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </Select>
                  </Field>
                  <Field
                    htmlFor="wishlist-item-notes"
                    label="Notas"
                    optional
                  >
                    <Input
                      id="wishlist-item-notes"
                      value={itemForm.notes}
                      onChange={(event) =>
                        updateItem("notes", event.target.value)
                      }
                      placeholder="Color, talla, detalles..."
                      maxLength={500}
                      autoComplete="off"
                    />
                  </Field>
                </div>

                {itemError ? (
                  <InlineAlert variant="warning">
                    <p>{itemError}</p>
                  </InlineAlert>
                ) : null}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={closeItemForm}
                    disabled={itemSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    loading={itemSaving}
                    onClick={() => void handleSaveItem()}
                  >
                    {editingId ? "Guardar cambios" : "Agregar a mi lista"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-5">
            <Field
              htmlFor="wishlist-notes"
              label="Notas generales"
              hint="Opcional. Úsalas para gustos, tallas o ideas sueltas."
            >
              <textarea
                id="wishlist-notes"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setDirty(true);
                }}
                rows={3}
                maxLength={2000}
                placeholder={"Ej. Prefiero cosas hechas a mano\nTalla de camiseta: M"}
                className="min-h-24 w-full resize-y rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-pine/40 focus:ring-2 focus:ring-pine/15"
              />
            </Field>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted">
                {draft.length} de 2000 caracteres
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={savingNotes}
                disabled={!dirty}
                onClick={() => void handleSaveNotes()}
              >
                Guardar notas
              </Button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-line/70">
          {memberLists.map(({ member, items, notes }) => {
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
                    <ul className="mt-3 space-y-2.5">
                      {items.map((item) => {
                        const priority = PRIORITY_META[item.priority];

                        return (
                          <li
                            key={item.id}
                            className="rounded-2xl border border-line bg-paper p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-ink">
                                    {item.title}
                                  </p>
                                  <span
                                    className={cn(
                                      "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]",
                                      priority.className,
                                    )}
                                  >
                                    {priority.label}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                                  {item.price !== null ? (
                                    <span className="font-semibold text-pine-deep">
                                      {formatCurrency(
                                        Number(item.price),
                                        currency,
                                      )}
                                    </span>
                                  ) : null}
                                  {item.url ? (
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 font-semibold text-pine underline decoration-pine/30 underline-offset-2 transition hover:text-pine-deep"
                                    >
                                      <ExternalLink
                                        className="size-3"
                                        aria-hidden
                                      />
                                      {itemLinkLabel(item.url)}
                                    </a>
                                  ) : null}
                                </div>
                                {item.notes ? (
                                  <p className="mt-1.5 text-xs leading-relaxed text-muted">
                                    {item.notes}
                                  </p>
                                ) : null}
                              </div>

                              {isCurrentUser ? (
                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEdit(item)}
                                    className="rounded-full p-1.5 text-muted transition hover:bg-sand hover:text-ink"
                                    aria-label={`Editar ${item.title}`}
                                  >
                                    <Pencil className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingDelete(item)}
                                    className="rounded-full p-1.5 text-muted transition hover:bg-terra/10 hover:text-terra-deep"
                                    aria-label={`Eliminar ${item.title}`}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}

                  {notes ? (
                    <div className="mt-3 flex items-start gap-2 rounded-2xl bg-cream/70 p-3">
                      <StickyNote
                        className="mt-0.5 size-3.5 shrink-0 text-pine"
                        aria-hidden
                      />
                      <p className="whitespace-pre-line break-words text-xs leading-relaxed text-muted">
                        {notes}
                      </p>
                    </div>
                  ) : null}

                  {!items.length && !notes ? (
                    <p className="mt-1 text-xs italic text-muted">
                      Aún no agregó ideas.
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="¿Eliminar este regalo?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" se quitará de tu lista para toda la sala.`
            : ""
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        loading={deleting}
        tone="danger"
        icon={<Trash2 className="size-5" />}
        onConfirm={() => void handleDeleteItem()}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
      />
    </>
  );
}
