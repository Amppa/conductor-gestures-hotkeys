/**
 * Gesture and trigger display helpers.
 * Formats mouse triggers and direction arrows with i18n support.
 */
import type { TFunction } from "i18next";
import { Gesture, GestureTrigger } from "../../domain/types";
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

function normalizeArrows(text: string): string {
  return Array.from(text, (character) => ARROW_ALIASES[character] ?? character).join(
    "",
  );
}

export function formatGestureName(
  trigger: string,
  steps: string[],
  t: TFunction,
): string {
  const key = normalizeTrigger(trigger);
  const label = t(`triggers.${key}`, { defaultValue: key });
  const button = label.replace(/^[RML] \((.*)\)$/, "$1");
  return (
    button +
    (steps.length ? " " + steps.map((step) => formatStepSymbol(step, t)).join("") : "")
  );
}

/**
 * Uses the translated template name when it exists, otherwise keeps the
 * user-provided name stored on the template.
 */
export function formatTemplateName(t: TFunction, gesture: Gesture): string {
  const translated = t(`gestureNames.${gesture.id}`, { defaultValue: "" });
  return translated
    ? formatGestureName(gesture.trigger, gesture.steps, t)
    : gesture.name;
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

export function formatTriggerSymbol(trigger: string, t?: TFunction): string {
  const normalized = normalizeTrigger(trigger);
  if (t) {
    return t(`triggers.${normalized}`, { defaultValue: normalized });
  }

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
  const isMouse = MOUSE_TRIGGERS.includes(normalized);
  const label = isMouse ? normalized : formatTriggerSymbol(normalized, t);

  if (steps.length === 0) {
    if (isMouse) {
      const clickText = t ? t("triggers.click") : "Click";
      return `${label} (${clickText})`;
    }
    return label;
  }

  if (steps[0] === "WU" || steps[0] === "WD") {
    return `${label} + ${formatStepSymbol(steps[0], t)}`;
  }

  const stepArrows = steps.map((step) => formatStepSymbol(step, t)).join("");
  return isMouse ? `${label}${stepArrows}` : `${label} ${stepArrows}`;
}

/**
 * Parses user-input gesture text (e.g. "R→↘", "→↘", "DR", "R↓→", "R + W↑")
 * into a normalized trigger and step array.
 */
export function parseStrokeInput(
  rawInput: string,
  fallbackTrigger: string = "R",
): { trigger: GestureTrigger; steps: string[] } {
  let text = normalizeArrows(rawInput.trim().replace(/滾輪|wheel/gi, "W"));
  let trigger: GestureTrigger = fallbackTrigger;

  for (const knownTrigger of KNOWN_TRIGGERS) {
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
