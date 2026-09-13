import type { Kind } from "./domain";

export const palette = {
  bg: "#FAFAF8",
  surface: "#FFFFFF",
  ink: "#1B1E23",
  muted: "#737A82",
  faint: "#A9AFB6",
  border: "#E8E6E1",
  ok: "#177A46",
  okTint: "#EAF6EF",
  okBorder: "#BFE3CD",
  warn: "#9A6208",
  warnTint: "#FDF4E0",
  danger: "#B3392F",
  dangerTint: "#FBEDEA",
  info: "#5B6472",
  infoTint: "#F1F3F5",
};

/** One accent per Kind: Easy green, Quality amber, Rest gray, Walk blue. */
export const kindStyle: Record<Kind, { color: string; tint: string; border: string }> = {
  easy: { color: "#1E7F4F", tint: "#EAF6EF", border: "#CDE8D8" },
  quality: { color: "#9A6208", tint: "#FDF4E0", border: "#F0DCA8" },
  rest: { color: "#6B7280", tint: "#F3F4F6", border: "#E3E5E9" },
  walk: { color: "#2A5FA8", tint: "#EBF2FC", border: "#C9DCF4" },
};

export const radius = { card: 16, sheet: 22, control: 12, pill: 999 };
