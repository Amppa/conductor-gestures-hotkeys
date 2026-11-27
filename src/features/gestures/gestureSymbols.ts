import type { TFunction } from "i18next";
import { normalizeTrigger } from "../../domain/triggerNormalization";
import { parseGestureInput } from "../../domain/triggers/gestureInput";
import { SCREEN_ZONES } from "../../domain/triggers/screen";
import { MOUSE_BUTTONS } from "../../domain/triggerTypes";

const MOUSE_TRIGGER_SET = new Set<string>(MOUSE_BUTTONS);

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
  if (normalized in SCREEN_ZONES) return SCREEN_ZONES[normalized as keyof typeof SCREEN_ZONES].symbol;
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
  let label = MOUSE_TRIGGER_SET.has(normalized)
    ? normalized
    : formatTriggerSymbol(normalized);
  if (/^(Edge|Corner)/.test(normalized) && t) {
    label += " " + t(`screenLabels.${normalized}`);
  }
  return [label, ...steps.map((step) => formatStepSymbol(step, t))].join(", ");
}


export function parseStrokeInput(raw: string, fallback = "R"): { trigger: string; steps: string[] } {
  const { trigger, steps } = parseGestureInput(raw, fallback);
  return { trigger, steps };
}

export function validateStrokeInput(raw: string, fallback: string): string | null {
  return parseGestureInput(raw, fallback).error;
}
