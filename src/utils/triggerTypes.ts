import { Gesture, GestureTrigger } from "../types";

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
  return !MOUSE_OR_SPATIAL_TRIGGERS.has(trigger);
}

export function isKeyboardTemplate(template: Gesture): boolean {
  return isKeyboardTrigger(template.trigger);
}
