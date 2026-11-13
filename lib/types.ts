export type GroupStatus = "pending" | "completed";

export type CurrencyCode = "VES" | "USD" | "USDT" | "MXN" | "COP" | "ARS";

export interface Group {
  id: string;
  invite_code: string;
  name: string;
  creator_id: string;
  min_budget: number;
  max_budget: number;
  currency: CurrencyCode;
  max_participants: number;
  draw_at: string | null;
  status: GroupStatus;
  created_at: string;
  completed_at: string | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  joined_at: string;
}

export interface Exclusion {
  id: string;
  group_id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
}

export interface DrawResult {
  id: string;
  group_id: string;
  giver_id: string;
  receiver_id: string;
  created_at: string;
}

export interface GroupWishlist {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  updated_at: string;
}

export type WishlistPriority = "low" | "medium" | "high";

export interface GroupWishlistItem {
  id: string;
  group_id: string;
  user_id: string;
  title: string;
  url: string | null;
  price: number | null;
  notes: string | null;
  priority: WishlistPriority;
  created_at: string;
  updated_at: string;
}

export interface GroupBan {
  id: string;
  group_id: string;
  user_id: string;
  blocked_at: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
}

export interface GroupWithCount extends Group {
  group_members: { count: number }[];
}

export interface GroupData {
  group: Group;
  members: GroupMember[];
  exclusions: Exclusion[];
  drawResult: DrawResult | null;
  wishlists: GroupWishlist[];
  wishlistItems: GroupWishlistItem[];
  bans: GroupBan[];
}

export interface LocalUser {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  has_password: boolean;
}
