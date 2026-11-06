import type { CurrencyCode } from "@/lib/types";

export const CURRENCIES: {
  code: CurrencyCode;
  label: string;
  symbol: string;
}[] = [
  { code: "MXN", label: "Peso mexicano", symbol: "$" },
  { code: "USD", label: "Dólar estadounidense", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "COP", label: "Peso colombiano", symbol: "$" },
  { code: "ARS", label: "Peso argentino", symbol: "$" },
  { code: "CLP", label: "Peso chileno", symbol: "$" },
  { code: "PEN", label: "Sol peruano", symbol: "S/" },
  { code: "UYU", label: "Peso uruguayo", symbol: "$" },
];

export const CURRENCY_CODES = CURRENCIES.map((currency) => currency.code) as [
  CurrencyCode,
  ...CurrencyCode[],
];
