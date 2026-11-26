import { Gesture, GestureTrigger } from "./types";

export const MOUSE_BUTTONS = ["L", "M", "R", "X1", "X2"] as const;
export const TRIGGER_CATEGORIES = ["gestures", "mouseButtons", "screen", "hotkeys"] as const;
export type TriggerCategory = typeof TRIGGER_CATEGORIES[number];

export function getTriggerCategory(template: Gesture): TriggerCategory {
  if (isScreenTemplate(template)) return "screen";
  if (isMouseTrigger(template.trigger) && template.steps.length === 0) return "mouseButtons";
  return isKeyboardTemplate(template) ? "hotkeys" : "gestures";
}

export function mouseTriggerKind(gesture: Pick<Gesture, "trigger" | "steps">): "buttons" | "direction" | "wheel" | null {
  if (!isMouseTrigger(gesture.trigger) || gesture.trigger === "L") return null;
  if (!gesture.steps.length) return gesture.trigger.includes("+") || ["X1", "X2"].includes(gesture.trigger) ? "buttons" : null;
  if (gesture.trigger.includes("+")) return null;
  if (gesture.trigger === "M") return null;
  if (gesture.steps.length === 1 && ["WU", "WD"].includes(gesture.steps[0])) return "wheel";
  return gesture.steps.every((step) => ["U", "D", "L", "R", "UL", "UR", "DL", "DR"].includes(step)) ? "direction" : null;
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
