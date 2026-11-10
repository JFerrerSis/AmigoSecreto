import { NextResponse } from "next/server";

import { deleteGroup, getGroupDataForUser } from "@/lib/db/groups";
import { localErrorResponse, requireUser } from "@/lib/local/responses";
import { getSessionUser } from "@/lib/local/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireUser(await getSessionUser());
    const { id } = await params;

    const data = await getGroupDataForUser(id, user.id);

    return NextResponse.json(data);
  } catch (error) {
    return localErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = requireUser(await getSessionUser());
    const { id } = await params;

    await deleteGroup(id, user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return localErrorResponse(error);
  }
}
