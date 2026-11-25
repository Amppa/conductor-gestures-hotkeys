import { Gesture, GestureTrigger } from "./types";

export const MOUSE_BUTTONS = ["L", "M", "R", "X1", "X2"] as const;
export const TRIGGER_CATEGORIES = ["gestures", "screen", "hotkeys"] as const;
export type TriggerCategory = typeof TRIGGER_CATEGORIES[number];

export function getTriggerCategory(template: Gesture): TriggerCategory {
  if (isScreenTemplate(template)) return "screen";
  return isKeyboardTemplate(template) ? "hotkeys" : "gestures";
}

const MOUSE_OR_SPATIAL_TRIGGERS = new Set<string>([
  "R",
  "RB",
  "RButton",
  "M",
  "MB",
  "MButton",
  "L",
  "LB",
  "LButton",
  "X1",
  "X1B",
  "XButton1",
  "X2",
  "X2B",
  "XButton2",
  "CornerTL",
  "CornerTR",
  "CornerBL",
  "CornerBR",
  "EdgeTop",
  "EdgeBottom",
  "EdgeLeft",
  "EdgeRight",
]);

export function isKeyboardTrigger(trigger: GestureTrigger): boolean {
  return !MOUSE_OR_SPATIAL_TRIGGERS.has(trigger) && !isMouseTrigger(trigger);
}

export function isMouseTrigger(trigger: string): boolean {
  return trigger.split("+").every((key) => MOUSE_BUTTONS.some((button) => button === key));
}

export function isKeyboardTemplate(template: Gesture): boolean {
  return isKeyboardTrigger(template.trigger);
}

export function isScreenTemplate(template: Gesture): boolean {
  return /^(Edge(Top|Bottom|Left|Right|TopL|TopR)|Corner(TL|TR|BL|BR))$/.test(template.trigger);
}
