import { describe, expect, it } from "bun:test";

import {
  createGroupSchema,
  joinGroupSchema,
  passwordChangeSchema,
  removeMemberSchema,
  sessionSchema,
  updateGroupSchema,
  wishlistItemSchema,
} from "./validation";

const validGroup = {
  name: "Intercambio de prueba",
  minBudget: 100,
  maxBudget: 500,
  currency: "USDT",
  maxParticipants: 8,
  drawAt: "2099-01-01T12:00:00.000Z",
  website: "",
};

describe("createGroupSchema", () => {
  it("accepts the main currencies, including USDT", () => {
    expect(createGroupSchema.safeParse(validGroup).success).toBe(true);
  });

  it("rejects currencies outside the main list", () => {
    expect(
      createGroupSchema.safeParse({
        ...validGroup,
        currency: "EUR",
      }).success,
    ).toBe(false);
  });

  it("rejects the removed email notification option", () => {
    expect(
      createGroupSchema.safeParse({
        ...validGroup,
        sendEmails: true,
      }).success,
    ).toBe(false);
  });
});

describe("joinGroupSchema", () => {
  it("normalizes a valid room code", () => {
    expect(joinGroupSchema.parse({ code: " abcd12 " }).code).toBe("ABCD12");
  });

  it("rejects invalid room codes", () => {
    expect(joinGroupSchema.safeParse({ code: "abc" }).success).toBe(false);
    expect(joinGroupSchema.safeParse({ code: "abc 123" }).success).toBe(false);
  });
});

describe("removeMemberSchema", () => {
  it("defaults to removing without a block", () => {
    expect(removeMemberSchema.parse({}).block).toBe(false);
  });

  it("accepts an explicit block", () => {
    expect(removeMemberSchema.parse({ block: true }).block).toBe(true);
  });

  it("rejects invalid block values", () => {
    expect(
      removeMemberSchema.safeParse({ block: "yes" }).success,
    ).toBe(false);
  });
});

describe("updateGroupSchema", () => {
  it("accepts a legacy currency when editing", () => {
    expect(
      updateGroupSchema.safeParse({ ...validGroup, currency: "EUR" }).success,
    ).toBe(true);
  });

  it("normalizes the currency to uppercase", () => {
    expect(
      updateGroupSchema.parse({ ...validGroup, currency: "usdt" }).currency,
    ).toBe("USDT");
  });

  it("rejects a budget range where max is lower than min", () => {
    expect(
      updateGroupSchema.safeParse({
        ...validGroup,
        minBudget: 500,
        maxBudget: 100,
      }).success,
    ).toBe(false);
  });
});

describe("sessionSchema", () => {
  it("requires a password when creating an account", () => {
    const result = sessionSchema.safeParse({
      intent: "create",
      fullName: "Ana",
      email: "ana@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an empty password for a legacy login attempt", () => {
    const result = sessionSchema.safeParse({
      intent: "login",
      email: "ana@example.com",
      password: "",
    });

    expect(result.success).toBe(true);
  });

  it("requires a strong password to set one", () => {
    const result = sessionSchema.safeParse({
      intent: "set-password",
      email: "ana@example.com",
      password: "12345678",
    });

    expect(result.success).toBe(true);
  });
});

describe("passwordChangeSchema", () => {
  it("rejects short new passwords", () => {
    expect(
      passwordChangeSchema.safeParse({ newPassword: "short" }).success,
    ).toBe(false);
  });
});

describe("wishlistItemSchema", () => {
  it("normalizes empty optional fields to null", () => {
    const parsed = wishlistItemSchema.parse({
      title: "  Un libro  ",
      url: "",
      price: "",
      notes: "",
      priority: "high",
    });

    expect(parsed.title).toBe("Un libro");
    expect(parsed.url).toBeNull();
    expect(parsed.price).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("rejects invalid links", () => {
    expect(
      wishlistItemSchema.safeParse({
        title: "Algo",
        url: "no-es-un-link",
        priority: "medium",
      }).success,
    ).toBe(false);
  });
});
