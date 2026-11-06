export interface DrawMember {
  user_id: string;
  full_name: string;
}

export interface DrawExclusion {
  user_id_1: string;
  user_id_2: string;
}

export interface DrawPair {
  giver_id: string;
  receiver_id: string;
}

export type DrawErrorCode =
  | "INSUFFICIENT_MEMBERS"
  | "DUPLICATE_MEMBERS"
  | "NO_VALID_ASSIGNMENT";

export class DrawError extends Error {
  code: DrawErrorCode;

  constructor(code: DrawErrorCode, message: string) {
    super(message);
    this.name = "DrawError";
    this.code = code;
  }
}

function pairKey(a: string, b: string) {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }

  return copy;
}

/**
 * Finds a perfect matching using Kuhn's augmenting-path algorithm.
 * The randomized order of givers and receivers makes every valid draw
 * different while still guaranteeing a solution when one exists.
 */
function findPerfectMatching(
  memberIds: string[],
  blockedPairs: Set<string>,
): Map<string, string> | null {
  const adjacency = new Map<string, string[]>();

  for (const giverId of memberIds) {
    const possibleReceivers = memberIds.filter(
      (receiverId) =>
        receiverId !== giverId &&
        !blockedPairs.has(pairKey(giverId, receiverId)),
    );

    adjacency.set(giverId, shuffle(possibleReceivers));
  }

  const giverByReceiver = new Map<string, string>();

  function tryAssign(giverId: string, visitedReceivers: Set<string>) {
    for (const receiverId of adjacency.get(giverId) ?? []) {
      if (visitedReceivers.has(receiverId)) continue;
      visitedReceivers.add(receiverId);

      const currentGiver = giverByReceiver.get(receiverId);

      if (!currentGiver || tryAssign(currentGiver, visitedReceivers)) {
        giverByReceiver.set(receiverId, giverId);
        return true;
      }
    }

    return false;
  }

  for (const giverId of shuffle(memberIds)) {
    if (!tryAssign(giverId, new Set())) {
      return null;
    }
  }

  const assignment = new Map<string, string>();

  for (const [receiverId, giverId] of giverByReceiver) {
    assignment.set(giverId, receiverId);
  }

  return assignment;
}

export function buildDraw(
  members: DrawMember[],
  exclusions: DrawExclusion[],
): DrawPair[] {
  if (members.length < 2) {
    throw new DrawError(
      "INSUFFICIENT_MEMBERS",
      "Necesitas al menos 2 participantes para ejecutar el sorteo.",
    );
  }

  const memberIds = members.map((member) => member.user_id);
  const uniqueIds = new Set(memberIds);

  if (uniqueIds.size !== memberIds.length) {
    throw new DrawError(
      "DUPLICATE_MEMBERS",
      "Hay participantes duplicados en esta sala.",
    );
  }

  const blockedPairs = new Set<string>();

  for (const exclusion of exclusions) {
    if (
      exclusion.user_id_1 === exclusion.user_id_2 ||
      !uniqueIds.has(exclusion.user_id_1) ||
      !uniqueIds.has(exclusion.user_id_2)
    ) {
      continue;
    }

    blockedPairs.add(pairKey(exclusion.user_id_1, exclusion.user_id_2));
  }

  const assignment = findPerfectMatching(memberIds, blockedPairs);

  if (!assignment) {
    throw new DrawError(
      "NO_VALID_ASSIGNMENT",
      "No existe una combinación válida con las exclusiones actuales. Revisa las parejas bloqueadas e inténtalo de nuevo.",
    );
  }

  const pairs: DrawPair[] = [];

  for (const giverId of memberIds) {
    const receiverId = assignment.get(giverId);

    if (
      !receiverId ||
      receiverId === giverId ||
      blockedPairs.has(pairKey(giverId, receiverId))
    ) {
      throw new DrawError(
        "NO_VALID_ASSIGNMENT",
        "El sorteo generó una combinación inválida. Inténtalo de nuevo.",
      );
    }

    pairs.push({ giver_id: giverId, receiver_id: receiverId });
  }

  const receivers = new Set(pairs.map((pair) => pair.receiver_id));

  if (receivers.size !== memberIds.length) {
    throw new DrawError(
      "NO_VALID_ASSIGNMENT",
      "El sorteo no asignó a todos los participantes. Inténtalo de nuevo.",
    );
  }

  return pairs;
}
