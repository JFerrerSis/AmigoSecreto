"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useLocalUser } from "@/hooks/use-local-user";
import type {
  DrawResult,
  Exclusion,
  Group,
  GroupBan,
  GroupMember,
  GroupWishlist,
  GroupWishlistItem,
} from "@/lib/types";

interface GroupDataState {
  loading: boolean;
  error: string | null;
  group: Group | null;
  members: GroupMember[];
  exclusions: Exclusion[];
  drawResult: DrawResult | null;
  wishlists: GroupWishlist[];
  wishlistItems: GroupWishlistItem[];
  bans: GroupBan[];
}

interface GroupPayload {
  group: Group;
  members: GroupMember[];
  exclusions: Exclusion[];
  drawResult: DrawResult | null;
  wishlists: GroupWishlist[];
  wishlistItems: GroupWishlistItem[];
  bans: GroupBan[];
  error?: string;
}

const initialState: GroupDataState = {
  loading: true,
  error: null,
  group: null,
  members: [],
  exclusions: [],
  drawResult: null,
  wishlists: [],
  wishlistItems: [],
  bans: [],
};

function groupCacheKey(groupId: string, userId: string) {
  return `amigo-secreto:group:${groupId}:${userId}`;
}

function readCachedGroup(
  groupId: string,
  userId: string,
): GroupDataState | null {
  if (typeof window === "undefined" || !userId) return null;

  try {
    const raw = window.localStorage.getItem(groupCacheKey(groupId, userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Omit<GroupDataState, "loading" | "error">;
    if (!parsed?.group) return null;

    return {
      ...parsed,
      wishlists: parsed.wishlists ?? [],
      wishlistItems: parsed.wishlistItems ?? [],
      bans: parsed.bans ?? [],
      loading: false,
      error: null,
    };
  } catch {
    return null;
  }
}
function cacheGroup(groupId: string, userId: string, state: GroupDataState) {
  if (typeof window === "undefined" || !userId) return;

  try {
    window.localStorage.setItem(
      groupCacheKey(groupId, userId),
      JSON.stringify({
        group: state.group,
        members: state.members,
        exclusions: state.exclusions,
        drawResult: state.drawResult,
        wishlists: state.wishlists,
        wishlistItems: state.wishlistItems,
        bans: state.bans,
      }),
    );
  } catch {
    return;
  }
}

export function useGroupData(groupId: string, userId: string) {
  const { refresh: refreshSession } = useLocalUser();
  const [state, setState] = useState<GroupDataState>(initialState);
  const mountedRef = useRef(true);

  const load = useCallback(
    async (silent = false) => {
      if (!userId) {
        setState({ ...initialState, loading: false });
        return;
      }

      if (!silent) {
        const cached = readCachedGroup(groupId, userId);

        if (cached) {
          setState(cached);
        } else {
          setState((current) => ({
            ...current,
            loading: true,
            error: null,
          }));
        }
      }

      try {
        const response = await fetch(`/api/groups/${groupId}`, {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (response.status === 401) {
          await refreshSession();
        }

        const payload = (await response.json().catch(() => null)) as
          | GroupPayload
          | null;

        if (!mountedRef.current) return;

        if (!response.ok || !payload?.group) {
          throw new Error(
            payload?.error ??
              "No pudimos cargar esta sala. Inténtalo de nuevo.",
          );
        }

        const nextState: GroupDataState = {
          loading: false,
          error: null,
          group: payload.group,
          members: payload.members ?? [],
          exclusions: payload.exclusions ?? [],
          drawResult: payload.drawResult ?? null,
          wishlists: payload.wishlists ?? [],
          wishlistItems: payload.wishlistItems ?? [],
          bans: payload.bans ?? [],
        };

        setState(nextState);
        cacheGroup(groupId, userId, nextState);
      } catch (error) {
        if (!mountedRef.current) return;

        const message =
          error instanceof Error
            ? error.message
            : "No pudimos cargar esta sala. Inténtalo de nuevo.";

        setState((current) => ({
          ...current,
          loading: false,
          error: message,
        }));
      }
    },
    [groupId, refreshSession, userId],
  );

  useEffect(() => {
    mountedRef.current = true;
    void load();

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  useEffect(() => {
    if (!userId) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void load(true);
      }
    }, 4000);

    function handleFocus() {
      void load(true);
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [load, userId]);

  return { ...state, refresh: load };
}
