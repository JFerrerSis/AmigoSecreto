import { NextResponse } from "next/server";
import { z } from "zod";

import { upsertGroupWishlist } from "@/lib/db/groups";
import { LocalApiError } from "@/lib/local/errors";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";

const wishlistSchema = z
  .object({
    content: z
      .string()
      .max(2000, "La lista no puede superar los 2000 caracteres."),
  })
  .strict();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, {
      scope: "wishlist-update",
      limit: 60,
      windowMs: 10 * 60_000,
    });

    const user = requireUser(await getSessionUser());
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = wishlistSchema.safeParse(body);

    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "La lista no es válida.",
        422,
      );
    }

    const wishlist = await upsertGroupWishlist(
      id,
      user.id,
      parsed.data.content,
    );

    return NextResponse.json({ wishlist });
  } catch (error) {
    return localErrorResponse(error);
  }
}
