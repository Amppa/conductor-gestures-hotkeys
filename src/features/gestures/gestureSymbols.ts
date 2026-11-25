/**
 * Gesture and trigger display helpers.
 * Formats mouse triggers and direction arrows with i18n support.
 */
import type { TFunction } from "i18next";
import { GestureTrigger } from "../../domain/types";
import { normalizeTrigger } from "../../domain/triggerNormalization";

const ARROW_ALIASES: Record<string, string> = {
  "🡐": "←",
  "🡑": "↑",
  "🡒": "→",
  "🡓": "↓",
  "🡔": "↖",
  "🡕": "↗",
  "🡖": "↘",
  "🡗": "↙",
  "🡠": "←",
  "🡡": "↑",
  "🡢": "→",
  "🡣": "↓",
  "🡤": "↖",
  "🡥": "↗",
  "🡦": "↘",
  "🡧": "↙",
  "⭠": "←",
  "⭡": "↑",
  "⭢": "→",
  "⭣": "↓",
};

const ARROW_STEPS: Record<string, string> = {
  "←": "L",
  "↑": "U",
  "→": "R",
  "↓": "D",
  "↖": "UL",
  "↗": "UR",
  "↙": "DL",
  "↘": "DR",
};

const LETTER_STEPS: Record<string, string> = {
  U: "U",
  D: "D",
  L: "L",
  R: "R",
};

const KNOWN_TRIGGERS: GestureTrigger[] = [
  "CornerTL",
  "CornerTR",
  "CornerBL",
  "CornerBR",
  "EdgeTop",
  "EdgeBottom",
  "EdgeLeft",
  "EdgeRight",
  "X1",
  "X2",
  "R",
  "M",
  "L",
];

const MOUSE_TRIGGERS = ["R", "M", "L", "X1", "X2"];

function stripScreenLabel(text: string): string {
  return text.replace(/^([⬒⬓◧◨◰◱◲◳])\s*(?:Edge [TBLR]|Corner (?:TL|BL|BR|TR)|上側|下側|左側|右側|左上角|左下角|右下角|右上角)(?=\s|,|$)/i, "$1");
}

function normalizeArrows(text: string): string {
  return Array.from(text, (character) => ARROW_ALIASES[character] ?? character).join(
    "",
  );
}

export function formatStepSymbol(step: string, t?: TFunction): string {
  switch (step.toUpperCase()) {
    case "U":
    case "UP":
      return "🡡";
    case "D":
    case "DOWN":
      return "🡣";
    case "L":
    case "LEFT":
      return "🡠";
    case "R":
    case "RIGHT":
      return "🡢";
    case "UL":
    case "UP_LEFT":
      return "🡤";
    case "UR":
    case "UP_RIGHT":
      return "🡥";
    case "DL":
    case "DOWN_LEFT":
      return "🡧";
    case "DR":
    case "DOWN_RIGHT":
      return "🡦";
    case "WU":
    case "WHEEL_UP":
      return t ? t("triggers.wheelUp") : "Wheel↑";
    case "WD":
    case "WHEEL_DOWN":
      return t ? t("triggers.wheelDown") : "Wheel↓";
    default:
      return step;
  }
}

export function formatTriggerSymbol(trigger: string): string {
  const normalized = normalizeTrigger(trigger);
  switch (normalized) {
    case "R":
      return "R";
    case "M":
      return "M";
    case "L":
      return "L";
    case "X1":
      return "X1";
    case "X2":
      return "X2";
    case "CornerTL":
      return "◰";
    case "CornerTR":
      return "◳";
    case "CornerBL":
      return "◱";
    case "CornerBR":
      return "◲";
    case "EdgeTop":
      return "⬒";
    case "EdgeBottom":
      return "⬓";
    case "EdgeLeft":
      return "◧";
    case "EdgeRight":
      return "◨";
    default:
      return normalized;
  }
}

export function formatGestureLabel(
  trigger: string,
  steps: string[],
  t?: TFunction,
): string {
  const normalized = normalizeTrigger(trigger);
  let label = MOUSE_TRIGGERS.includes(normalized)
    ? normalized
    : formatTriggerSymbol(normalized);
  if (/^(Edge|Corner)/.test(normalized) && t) {
    label += " " + t(`screenLabels.${normalized}`);
  }
  return [label, ...steps.map((step) => formatStepSymbol(step, t))].join(", ");
}

/**
 * Parses user-input gesture text (e.g. "R→↘", "→↘", "DR", "R↓→", "R + W↑")
 * into a normalized trigger and step array.
 */
export function parseStrokeInput(
  rawInput: string,
  fallbackTrigger: string = "R",
): { trigger: GestureTrigger; steps: string[] } {
  let text = normalizeArrows(stripScreenLabel(rawInput).trim().replace(/滾輪|wheel/gi, "W"));
  let trigger: GestureTrigger = fallbackTrigger;
  const spatial = KNOWN_TRIGGERS.find((key) => /^(Edge|Corner)/.test(key) && text.startsWith(formatTriggerSymbol(key)));
  if (spatial) {
    trigger = spatial;
    text = text.slice(formatTriggerSymbol(spatial).length);
  }

  const buttons = /^(?:X[12]|[LMR])(?:\+(?:X[12]|[LMR]))+(?=\s|,|$)/.exec(text);
  if (buttons) {
    trigger = normalizeTrigger(buttons[0]);
    text = text.slice(buttons[0].length);
  }

  for (const knownTrigger of buttons ? [] : KNOWN_TRIGGERS) {
    if (text.startsWith(knownTrigger)) {
      trigger = knownTrigger;
      text = text.slice(knownTrigger.length).replace(/^[:\s+]+/, "");
      break;
    }
  }

  const steps: string[] = [];
  let index = 0;
  while (index < text.length) {
    if (/[\s,:+]/.test(text[index])) {
      index += 1;
      continue;
    }

    const token = text.slice(index, index + 2).toUpperCase();
    if (token === "W↑" || token === "WU") {
      steps.push("WU");
      index += 2;
      continue;
    }
    if (token === "W↓" || token === "WD") {
      steps.push("WD");
      index += 2;
      continue;
    }
    if (["UL", "UR", "DL", "DR"].includes(token)) {
      steps.push(token);
      index += 2;
      continue;
    }

    const character = text[index];
    const arrowStep = ARROW_STEPS[character];
    if (arrowStep) {
      steps.push(arrowStep);
    } else {
      const letterStep = LETTER_STEPS[character.toUpperCase()];
      if (letterStep) {
        steps.push(letterStep);
      }
    }
    index += 1;
  }

  return { trigger, steps };
}

export function validateStrokeInput(raw: string, fallback: string): string | null {
  let text = normalizeArrows(stripScreenLabel(raw).trim().replace(/滾輪|wheel/gi, "W"));
  const buttons = /^(?:X[12]|[LMR])(?:\+(?:X[12]|[LMR]))+(?=\s|,|$)/.exec(text);
  if (buttons) text = text.slice(buttons[0].length);
  if ((!text && !buttons) || /,\s*(,|$)/.test(text)) return "invalidStroke";
  const source = KNOWN_TRIGGERS.find((key) => text.startsWith(key));
  const symbolSource = KNOWN_TRIGGERS.find((key) => text.startsWith(formatTriggerSymbol(key)));
  const trigger = buttons?.[0] ?? source ?? symbolSource ?? fallback;
  if (!trigger) return "invalidStroke";
  if (trigger === "L") return "leftOnlyUnsupported";
  if (new Set(trigger.split("+")).size !== trigger.split("+").length) return "invalidStroke";
  if (source) text = text.slice(source.length);
  else if (symbolSource) text = text.slice(formatTriggerSymbol(symbolSource).length);
  text = text.replace(/^\s*,?\s*/, "");
  let count = 0;
  while (text) {
    const match = /^(W[↑↓]|WU|WD|UL|UR|DL|DR|[UDLR←↑→↓↖↗↙↘])/i.exec(text);
    if (!match) return "invalidStroke";
    count++;
    text = text.slice(match[0].length).replace(/^\s*,?\s*/, "");
  }
  if (!count && ["R", "M"].includes(trigger)) return "singleClickUnsupported";
  if (!count && trigger.startsWith("Edge")) return "invalidStroke";
  return null;
}
