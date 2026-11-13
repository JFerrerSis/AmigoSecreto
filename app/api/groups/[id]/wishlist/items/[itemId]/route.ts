import { NextResponse } from "next/server";

import {
  deleteWishlistItem,
  updateWishlistItem,
} from "@/lib/db/groups";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";
import { wishlistItemSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "wishlist-item-update",
      limit: 60,
      windowMs: 10 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const { id, itemId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = wishlistItemSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "El regalo no es válido.",
        422,
      );
    }

    const item = await updateWishlistItem(
      id,
      itemId,
      user.id,
      parsed.data,
    );

    return NextResponse.json({ item });
  } catch (error) {
    return localErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "wishlist-item-delete",
      limit: 60,
      windowMs: 10 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const { id, itemId } = await params;

    await deleteWishlistItem(id, itemId, user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return localErrorResponse(error);
  }
}
