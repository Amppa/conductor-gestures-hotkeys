import { parseSteps, StrokeInput } from "./stroke";

export const SCREEN_ZONES = {
  CornerTL: { symbol: "◰", en: "Corner TL", zh: "左上角" },
  CornerBL: { symbol: "◱", en: "Corner BL", zh: "左下角" },
  CornerBR: { symbol: "◲", en: "Corner BR", zh: "右下角" },
  CornerTR: { symbol: "◳", en: "Corner TR", zh: "右上角" },
  EdgeTop: { symbol: "⬒", en: "Edge T", zh: "上側" },
  EdgeBottom: { symbol: "⬓", en: "Edge B", zh: "下側" },
  EdgeLeft: { symbol: "◧", en: "Edge L", zh: "左側" },
  EdgeRight: { symbol: "◨", en: "Edge R", zh: "右側" },
} as const;

export function isScreenInput(raw: string): boolean {
  const text = raw.trim();
  return Object.entries(SCREEN_ZONES).some(([key, zone]) => text.startsWith(key) || text.startsWith(zone.symbol));
}

export function parseScreenInput(raw: string, fallback: string): StrokeInput {
  let text = raw.trim();
  let trigger = fallback;
  for (const [key, zone] of Object.entries(SCREEN_ZONES)) {
    if (text.startsWith(key)) {
      trigger = key;
      text = text.slice(key.length);
      break;
    }
    if (text.startsWith(zone.symbol)) {
      trigger = key;
      text = text.slice(zone.symbol.length).trimStart();
      const label = [zone.en, zone.zh].find((value) =>
        text.toLowerCase().startsWith(value.toLowerCase()) && /^(\s|,|$)/.test(text.slice(value.length)),
      );
      if (label) text = text.slice(label.length);
      break;
    }
  }
  const parsed = parseSteps(text);
  const error = !raw.trim() || !(trigger in SCREEN_ZONES) || (trigger.startsWith("Edge") && !parsed.steps.length)
    ? "invalidStroke" : parsed.error;
  return { trigger, steps: parsed.steps, error };
}
