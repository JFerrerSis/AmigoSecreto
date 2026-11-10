export type GroupStatus = "pending" | "completed";

export type CurrencyCode =
  | "MXN"
  | "USD"
  | "EUR"
  | "COP"
  | "ARS"
  | "CLP"
  | "PEN"
  | "UYU";

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
  send_emails: boolean;
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

export interface GroupWithCount extends Group {
  group_members: { count: number }[];
}

export interface GroupData {
  group: Group;
  members: GroupMember[];
  exclusions: Exclusion[];
  drawResult: DrawResult | null;
}

export interface LocalUser {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}
