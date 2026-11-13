import { describe, expect, it } from "bun:test";

import { CURRENCIES, CURRENCY_CODES } from "./currencies";
import { formatCurrency } from "./utils";

describe("currencies", () => {
  it("lists only the main supported currencies", () => {
    expect(CURRENCY_CODES).toEqual([
      "VES",
      "USD",
      "USDT",
      "MXN",
      "COP",
      "ARS",
    ]);
    expect(CURRENCIES).toHaveLength(6);
  });

  it("labels USDT clearly", () => {
    expect(
      CURRENCIES.find((currency) => currency.code === "USDT")?.label,
    ).toContain("USDT");
  });

  it("formats USDT without ISO currency support", () => {
    const formatted = formatCurrency(1234.5, "USDT");

    expect(formatted).toContain("USDT");
    expect(formatted).toContain("1,234.50");
  });
});
