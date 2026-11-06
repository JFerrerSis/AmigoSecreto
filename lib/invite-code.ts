import "server-only";

import { randomBytes } from "node:crypto";

export function generateInviteCode() {
  return randomBytes(9).toString("base64url");
}
