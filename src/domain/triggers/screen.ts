import { parseSteps, StrokeInput } from "./stroke";
import type { Gesture } from "../types";

export const SCREEN_ZONES = {
  CornerTL: { symbol: "◰", en: "Corner TL", zh: "左上角" },
  CornerBL: { symbol: "◱", en: "Corner BL", zh: "左下角" },
  CornerBR: { symbol: "◲", en: "Corner BR", zh: "右下角" },
  CornerTR: { symbol: "◳", en: "Corner TR", zh: "右上角" },
  EdgeTop: { symbol: "⬒", en: "Edge T", zh: "上側" },
  EdgeBottom: { symbol: "⬓", en: "Edge B", zh: "下側" },
  EdgeLeft: { symbol: "◧", en: "Edge L", zh: "左側" },
  EdgeRight: { symbol: "◨", en: "Edge R", zh: "右側" },
  EdgeTopLeftHalf: { symbol: "⬒", en: "Edge T-L", zh: "上側左半" },
  EdgeTopRightHalf: { symbol: "⬒", en: "Edge T-R", zh: "上側右半" },
  EdgeBottomLeftHalf: { symbol: "⬓", en: "Edge B-L", zh: "下側左半" },
  EdgeBottomRightHalf: { symbol: "⬓", en: "Edge B-R", zh: "下側右半" },
  EdgeLeftTopHalf: { symbol: "◧", en: "Edge L-T", zh: "左側上半" },
  EdgeLeftBottomHalf: { symbol: "◧", en: "Edge L-B", zh: "左側下半" },
  EdgeRightTopHalf: { symbol: "◨", en: "Edge R-T", zh: "右側上半" },
  EdgeRightBottomHalf: { symbol: "◨", en: "Edge R-B", zh: "右側下半" },
} as const;

const SCREEN_TRIGGER_ORDER: string[] = [
  "CornerTL", "CornerBL", "CornerBR", "CornerTR",
  "EdgeTop", "EdgeBottom", "EdgeLeft", "EdgeRight",
  "EdgeTopLeftHalf", "EdgeTopRightHalf",
  "EdgeBottomLeftHalf", "EdgeBottomRightHalf",
  "EdgeLeftTopHalf", "EdgeLeftBottomHalf",
  "EdgeRightTopHalf", "EdgeRightBottomHalf",
];

export function compareScreenTriggers(a: Pick<Gesture, "trigger" | "steps">, b: Pick<Gesture, "trigger" | "steps">): number {
  const rank = (trigger: string) => {
    const index = SCREEN_TRIGGER_ORDER.indexOf(trigger);
    return index < 0 ? SCREEN_TRIGGER_ORDER.length : index;
  };
  const stepRank = (steps: string[]) => steps[0] === "WU" ? 0 : steps[0] === "WD" ? 1 : 2;
  return rank(a.trigger) - rank(b.trigger) || stepRank(a.steps) - stepRank(b.steps);
}

export function screenEdgeSlots(trigger: string): number {
  const slots: Record<string, number> = {
    EdgeTop: 3, EdgeTopLeftHalf: 1, EdgeTopRightHalf: 2,
    EdgeBottom: 12, EdgeBottomLeftHalf: 4, EdgeBottomRightHalf: 8,
    EdgeLeft: 48, EdgeLeftTopHalf: 16, EdgeLeftBottomHalf: 32,
    EdgeRight: 192, EdgeRightTopHalf: 64, EdgeRightBottomHalf: 128,
  };
  return slots[trigger] ?? 0;
}

export function isScreenInput(raw: string): boolean {
  const text = raw.trim();
  return Object.entries(SCREEN_ZONES).some(([key, zone]) => text.startsWith(key) || text.startsWith(zone.symbol));
}

export function parseScreenInput(raw: string, fallback: string): StrokeInput {
  let text = raw.trim().replace(/^([⬒⬓◧◨◰◱◲◳])\s*/, "$1 ");
  let trigger = fallback;
  const candidates = Object.entries(SCREEN_ZONES).flatMap(([key, zone]) => [
    { key, text: key },
    ...[zone.en, zone.zh].map((label) => ({ key, text: `${zone.symbol} ${label}` })),
    ...(!key.endsWith("Half") ? [{ key, text: zone.symbol }] : []),
  ]).sort((a, b) => b.text.length - a.text.length);
  const source = candidates.find((candidate) => text.toLowerCase().startsWith(candidate.text.toLowerCase()) &&
    (candidate.text === candidate.key || candidate.text.length === 1 || /^(\s|,|$)/.test(text.slice(candidate.text.length))));
  if (source) { trigger = source.key; text = text.slice(source.text.length); }
  const parsed = parseSteps(text);
  const error = !raw.trim() || !(trigger in SCREEN_ZONES) || (trigger.startsWith("Edge") && !parsed.steps.length)
    ? "invalidStroke" : parsed.error;
  return { trigger, steps: parsed.steps, error };
}
