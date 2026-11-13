import type { CurrencyCode } from "@/lib/types";

export interface CurrencyOption {
  code: CurrencyCode;
  label: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  {
    code: "VES",
    label: "Bolívar venezolano",
    symbol: "Bs.",
  },
  {
    code: "USD",
    label: "Dólar estadounidense",
    symbol: "US$",
  },
  {
    code: "USDT",
    label: "Tether (USDT)",
    symbol: "USDT",
  },
  {
    code: "MXN",
    label: "Peso mexicano",
    symbol: "$",
  },
  {
    code: "COP",
    label: "Peso colombiano",
    symbol: "$",
  },
  {
    code: "ARS",
    label: "Peso argentino",
    symbol: "$",
  },
];

export const CURRENCY_CODES = CURRENCIES.map((currency) => currency.code) as [
  CurrencyCode,
  ...CurrencyCode[],
];
