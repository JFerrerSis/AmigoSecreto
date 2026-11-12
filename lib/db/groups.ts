import "server-only";

import type { PoolClient } from "pg";

import {
  isForeignKeyViolation,
  isPgRaise,
  isUniqueViolation,
  isUuid,
  query,
  withTransaction,
} from "@/lib/db/pool";
import {
  buildDraw,
  DrawError,
  type DrawPair,
} from "@/lib/draw";
import { generateInviteCode } from "@/lib/invite-code";
import { LocalApiError } from "@/lib/local/errors";
import type {
  DrawResult,
  Exclusion,
  Group,
  GroupData,
  GroupMember,
  GroupWishlist,
  GroupWithCount,
  LocalUser,
} from "@/lib/types";
import type { CreateGroupInput } from "@/lib/validation";

const GROUP_COLUMNS =
  "id, invite_code, name, creator_id, min_budget, max_budget, currency, max_participants, draw_at, send_emails, status, created_at, completed_at";

const MEMBER_COLUMNS =
  "id, group_id, user_id, email, full_name, avatar_url, joined_at";

const EXCLUSION_COLUMNS =
  "id, group_id, user_id_1, user_id_2, created_at";

const DRAW_COLUMNS =
  "id, group_id, giver_id, receiver_id, created_at";

const WISHLIST_COLUMNS =
  "id, group_id, user_id, content, updated_at";

export interface JoinGroupResult {
  groupId: string;
  alreadyMember: boolean;
}

export interface DrawRunResult {
  group: Group;
  members: GroupMember[];
  pairsCreated: number;
}

export async function listGroupsForUser(
  userId: string,
): Promise<GroupWithCount[]> {
  if (!isUuid(userId)) return [];

  const result = await query<Group & { member_count: number }>(
    `select g.*, count(all_members.id)::int as member_count
       from public.groups g
       join public.group_members me
         on me.group_id = g.id
        and me.user_id = $1
       left join public.group_members all_members
         on all_members.group_id = g.id
      group by g.id
      order by g.created_at desc`,
    [userId],
  );

  return result.rows.map(({ member_count, ...group }) => ({
    ...group,
    group_members: [{ count: member_count }],
  }));
}

export async function createGroupWithOwner(
  user: LocalUser,
  data: CreateGroupInput,
): Promise<Group> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const inviteCode = generateInviteCode();

    try {
      return await withTransaction(async (client) => {
        const groupResult = await client.query<Group>(
          `insert into public.groups (
             invite_code, name, creator_id,
             min_budget, max_budget, currency, max_participants,
             draw_at, send_emails, status
           )
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
           returning ${GROUP_COLUMNS}`,
          [
            inviteCode,
            data.name,
            user.id,
            data.minBudget,
            data.maxBudget,
            data.currency,
            data.maxParticipants,
            data.drawAt,
            data.sendEmails,
          ],
        );

        const group = groupResult.rows[0];

        await client.query(
          `insert into public.group_members (
             group_id, user_id, email, full_name, avatar_url
           )
           values ($1, $2, $3, $4, $5)`,
          [group.id, user.id, user.email, user.full_name, user.avatar_url],
        );

        return group;
      });
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
  }

  throw new LocalApiError(
    "No pudimos generar un código de sala. Inténtalo de nuevo.",
    500,
  );
}

export async function deleteGroup(
  groupId: string,
  userId: string,
): Promise<void> {  if (!isUuid(groupId) || !isUuid(userId)) {
    throw new LocalApiError("Esta sala no existe.", 404);
  }

  await withTransaction(async (client) => {
    const result = await client.query<{ creator_id: string }>(
      `select creator_id
         from public.groups
        where id = $1
          for update`,
      [groupId],
    );

    const group = result.rows[0];

    if (!group) {
      throw new LocalApiError("Esta sala no existe.", 404);
    }

    if (group.creator_id !== userId) {
      throw new LocalApiError(
        "Solo el organizador puede eliminar esta sala.",
        403,
      );
    }

    await client.query(`delete from public.groups where id = $1`, [groupId]);
  });
}

export async function removeGroupMember(
  groupId: string,
  memberId: string,
  userId: string,
): Promise<void> {
  if (!isUuid(groupId) || !isUuid(memberId) || !isUuid(userId)) {
    throw new LocalApiError("Ese participante ya no está en la sala.", 404);
  }

  await withTransaction(async (client) => {
    const groupResult = await client.query<{
      creator_id: string;
      status: string;
    }>(
      `select creator_id, status
         from public.groups
        where id = $1
          for update`,
      [groupId],
    );

    const group = groupResult.rows[0];

    if (!group) {
      throw new LocalApiError("Esta sala no existe.", 404);
    }

    if (group.creator_id !== userId) {
      throw new LocalApiError(
        "Solo el organizador puede sacar participantes.",
        403,
      );
    }

    if (group.status === "completed") {
      throw new LocalApiError(
        "El sorteo ya se realizó; no puedes sacar participantes.",
        409,
      );
    }

    if (memberId === group.creator_id) {
      throw new LocalApiError(
        "El organizador no puede salir de su propia sala.",
        409,
      );
    }

    const result = await client.query(
      `delete from public.group_members
        where group_id = $1
          and user_id = $2`,
      [groupId, memberId],
    );

    if (result.rowCount === 0) {
      throw new LocalApiError(
        "Ese participante ya no está en la sala.",
        404,
      );
    }
  });
}

export async function getGroupDataForUser(
  groupId: string,
  userId: string,
): Promise<GroupData> {
  if (!isUuid(groupId) || !isUuid(userId)) {
    throw new LocalApiError("Esta sala no existe.", 404);
  }

  const groupResult = await query<Group>(
    `select ${GROUP_COLUMNS} from public.groups where id = $1`,
    [groupId],
  );

  const group = groupResult.rows[0];

  if (!group) {
    throw new LocalApiError("Esta sala no existe.", 404);
  }

  const membersResult = await query<GroupMember>(
    `select ${MEMBER_COLUMNS}
       from public.group_members
      where group_id = $1
      order by joined_at asc`,
    [groupId],
  );

  const isMember = membersResult.rows.some(
    (member) => member.user_id === userId,
  );

  if (!isMember) {
    throw new LocalApiError(
      "No tienes permiso para ver esta sala. Pide una invitación al organizador.",
      403,
    );
  }

  const canSeeEmails = group.creator_id === userId;
  const members = membersResult.rows.map((member) =>
    canSeeEmails || member.user_id === userId
      ? member
      : { ...member, email: null },
  );

  const exclusionsResult = await query<Exclusion>(
    `select ${EXCLUSION_COLUMNS}
       from public.exclusions
      where group_id = $1
      order by created_at asc`,
    [groupId],
  );

  const wishlistsResult = await query<GroupWishlist>(
    `select ${WISHLIST_COLUMNS}
       from public.group_wishlists
      where group_id = $1
      order by updated_at desc`,
    [groupId],
  );

  let drawResult: DrawResult | null = null;

  if (group.status === "completed") {
    const result = await query<DrawResult>(
      `select ${DRAW_COLUMNS}
         from public.draw_results
        where group_id = $1
          and giver_id = $2`,
      [groupId, userId],
    );

    drawResult = result.rows[0] ?? null;
  }

  return {
    group,
    members,
    exclusions: exclusionsResult.rows,
    drawResult,
    wishlists: wishlistsResult.rows,
  };
}

export async function upsertGroupWishlist(
  groupId: string,
  userId: string,
  content: string,
): Promise<GroupWishlist> {
  if (!isUuid(groupId) || !isUuid(userId)) {
    throw new LocalApiError("No encontramos esta sala.", 404);
  }

  const cleanContent = content.replace(/\r\n/g, "\n").trim();

  if (cleanContent.length > 2000) {
    throw new LocalApiError(
      "La lista no puede superar los 2000 caracteres.",
      422,
    );
  }

  return withTransaction(async (client) => {
    const member = await client.query(
      `select 1
         from public.group_members
        where group_id = $1
          and user_id = $2`,
      [groupId, userId],
    );

    if (!member.rowCount) {
      throw new LocalApiError("No participas en esta sala.", 403);
    }

    const result = await client.query<GroupWishlist>(
      `insert into public.group_wishlists (group_id, user_id, content)
       values ($1, $2, $3)
       on conflict (group_id, user_id)
       do update set content = excluded.content,
                     updated_at = now()
       returning ${WISHLIST_COLUMNS}`,
      [groupId, userId, cleanContent],
    );

    return result.rows[0];
  });
}

export async function joinGroupByCode(
  code: string,
  user: LocalUser,
): Promise<JoinGroupResult> {
  const normalizedCode = code.trim().toUpperCase();

  return withTransaction(async (client) => {
    const groupResult = await client.query<Group>(
      `select ${GROUP_COLUMNS}
         from public.groups
        where upper(invite_code) = $1
          for update`,
      [normalizedCode],
    );

    const group = groupResult.rows[0];

    if (!group) {
      throw new LocalApiError(
        "Esta invitación no existe o ya no está disponible.",
        404,
      );
    }

    const existing = await client.query(
      `select 1
         from public.group_members
        where group_id = $1
          and user_id = $2`,
      [group.id, user.id],
    );

    if (existing.rowCount) {
      return { groupId: group.id, alreadyMember: true };
    }

    if (group.status === "completed") {
      throw new LocalApiError(
        "El sorteo de esta sala ya se realizó y las inscripciones están cerradas.",
        409,
      );
    }

    const countResult = await client.query<{ total: number }>(
      `select count(*)::int as total
         from public.group_members
        where group_id = $1`,
      [group.id],
    );

    if (countResult.rows[0].total >= group.max_participants) {
      throw new LocalApiError(
        "Esta sala ya está llena. Pide al organizador ampliar el cupo.",
        409,
      );
    }

    try {
      await client.query(
        `insert into public.group_members (
           group_id, user_id, email, full_name, avatar_url
         )
         values ($1, $2, $3, $4, $5)`,
        [group.id, user.id, user.email, user.full_name, user.avatar_url],
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { groupId: group.id, alreadyMember: true };
      }

      if (isPgRaise(error, "GROUP_FULL")) {
        throw new LocalApiError(
          "Esta sala ya está llena. Pide al organizador ampliar el cupo.",
          409,
        );
      }

      throw error;
    }

    return { groupId: group.id, alreadyMember: false };
  });
}

async function lockEditableGroup(
  client: PoolClient,
  groupId: string,
  userId: string,
): Promise<Group> {
  const result = await client.query<Group>(
    `select ${GROUP_COLUMNS}
       from public.groups
      where id = $1
        for update`,
    [groupId],
  );

  const group = result.rows[0];

  if (!group) {
    throw new LocalApiError("Esta sala no existe.", 404);
  }

  if (group.creator_id !== userId) {
    throw new LocalApiError(
      "Solo el organizador puede editar las exclusiones.",
      403,
    );
  }

  if (group.status === "completed") {
    throw new LocalApiError(
      "El sorteo ya se realizó; no puedes cambiar las exclusiones.",
      409,
    );
  }

  return group;
}

export async function createExclusion(
  groupId: string,
  userA: string,
  userB: string,
  userId: string,
): Promise<Exclusion> {
  if (!isUuid(groupId) || !isUuid(userA) || !isUuid(userB)) {
    throw new LocalApiError("Selecciona dos participantes válidos.", 422);
  }

  const [userOne, userTwo] = [userA, userB].sort();

  return withTransaction(async (client) => {
    const group = await lockEditableGroup(client, groupId, userId);

    const members = await client.query<{ user_id: string }>(
      `select user_id
         from public.group_members
        where group_id = $1
          and user_id = any($2::uuid[])`,
      [group.id, [userOne, userTwo]],
    );

    if (members.rowCount !== 2) {
      throw new LocalApiError(
        "Los dos participantes deben pertenecer a la sala.",
        422,
      );
    }

    try {
      const result = await client.query<Exclusion>(
        `insert into public.exclusions (group_id, user_id_1, user_id_2)
         values ($1, $2, $3)
         returning ${EXCLUSION_COLUMNS}`,
        [group.id, userOne, userTwo],
      );

      return result.rows[0];
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new LocalApiError("Esa pareja ya está bloqueada.", 409);
      }

      if (isForeignKeyViolation(error)) {
        throw new LocalApiError(
          "Los dos participantes deben pertenecer a la sala.",
          422,
        );
      }

      throw error;
    }
  });
}

export async function deleteExclusion(
  groupId: string,
  exclusionId: string,
  userId: string,
): Promise<void> {
  if (!isUuid(groupId) || !isUuid(exclusionId)) {
    throw new LocalApiError("Esa regla ya no existe.", 404);
  }

  await withTransaction(async (client) => {
    const group = await lockEditableGroup(client, groupId, userId);

    const result = await client.query(
      `delete from public.exclusions
        where id = $1
          and group_id = $2`,
      [exclusionId, group.id],
    );

    if (result.rowCount === 0) {
      throw new LocalApiError("Esa regla ya no existe.", 404);
    }
  });
}

export async function runGroupDraw(
  groupId: string,
  userId: string,
): Promise<DrawRunResult> {
  if (!isUuid(groupId) || !isUuid(userId)) {
    throw new LocalApiError("La sala no existe.", 404);
  }

  return withTransaction(async (client) => {
    const groupResult = await client.query<Group>(
      `select ${GROUP_COLUMNS}
         from public.groups
        where id = $1
          for update`,
      [groupId],
    );

    const group = groupResult.rows[0];

    if (!group) {
      throw new LocalApiError("La sala no existe.", 404);
    }

    if (group.creator_id !== userId) {
      throw new LocalApiError(
        "Solo el organizador puede ejecutar el sorteo.",
        403,
      );
    }

    if (group.status === "completed") {
      throw new LocalApiError("El sorteo de esta sala ya se realizó.", 409);
    }

    const membersResult = await client.query<GroupMember>(
      `select ${MEMBER_COLUMNS}
         from public.group_members
        where group_id = $1
        order by joined_at asc`,
      [groupId],
    );

    const exclusionsResult = await client.query<Exclusion>(
      `select ${EXCLUSION_COLUMNS}
         from public.exclusions
        where group_id = $1`,
      [groupId],
    );

    let pairs: DrawPair[];

    try {
      pairs = buildDraw(membersResult.rows, exclusionsResult.rows);
    } catch (error) {
      if (error instanceof DrawError) {
        throw new LocalApiError(error.message, 409, error.code);
      }

      throw error;
    }

    try {
      await client.query(
        `select public.save_draw_results($1, $2::jsonb)`,
        [groupId, JSON.stringify(pairs)],
      );
    } catch (error) {
      if (isPgRaise(error, "GROUP_NOT_FOUND")) {
        throw new LocalApiError("La sala no existe.", 404);
      }

      if (isPgRaise(error, "ALREADY_COMPLETED")) {
        throw new LocalApiError("El sorteo de esta sala ya se realizó.", 409);
      }

      if (
        isPgRaise(error, "INVALID_DRAW") ||
        isPgRaise(error, "MEMBER_MISMATCH") ||
        isPgRaise(error, "INVALID_ASSIGNMENT")
      ) {
        throw new LocalApiError(
          "No pudimos guardar el sorteo porque las asignaciones no son válidas. Inténtalo de nuevo.",
          409,
        );
      }

      if (isUniqueViolation(error)) {
        throw new LocalApiError(
          "El sorteo generó asignaciones duplicadas. Inténtalo de nuevo.",
          409,
        );
      }

      throw error;
    }

    const updatedResult = await client.query<Group>(
      `select ${GROUP_COLUMNS} from public.groups where id = $1`,
      [groupId],
    );

    return {
      group: updatedResult.rows[0] ?? group,
      members: membersResult.rows,
      pairsCreated: pairs.length,
    };
  });
}
