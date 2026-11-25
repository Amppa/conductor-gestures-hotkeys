import { AppConfig, Binding, Gesture, Target } from "./types";
import { MOUSE_BUTTONS } from "./triggerTypes";

/**
 * Maps legacy trigger aliases to their canonical token.
 * Persisted direction tokens and canonical triggers are returned unchanged.
 */
export function normalizeTrigger(trigger: string): string {
  const buttons = trigger.split("+");
  const order: readonly string[] = MOUSE_BUTTONS;
  if (buttons.length > 1 && buttons.every((key) => order.includes(key))) {
    return order.filter((key) => buttons.includes(key)).join("+");
  }
  switch (trigger) {
    case "RB":
    case "RButton":
      return "R";
    case "MB":
    case "MButton":
      return "M";
    case "LB":
    case "LButton":
      return "L";
    case "X1B":
    case "XButton1":
      return "X1";
    case "X2B":
    case "XButton2":
      return "X2";
    case "EdgeTopL":
    case "EdgeTopR":
      return "EdgeTop";
    default:
      return trigger;
  }
}

export function normalizeGesture(gesture: Gesture): Gesture {
  return {
    ...gesture,
    trigger: normalizeTrigger(gesture.trigger),
    steps: [...(gesture.steps ?? [])],
  };
}

export function normalizeBinding(binding: Binding): Binding {
  return {
    ...binding,
    gesture: normalizeGesture(binding.gesture),
  };
}

export function normalizeTarget(target: Target): Target {
  return {
    ...target,
    bindings: (target.bindings ?? []).map(normalizeBinding),
  };
}

/**
 * Normalizes every persisted trigger without changing template or rule identity.
 */
export function normalizeConfigTriggers(config: AppConfig): AppConfig {
  return {
    ...config,
    gestureTemplates: (config.gestureTemplates ?? []).map(normalizeGesture),
    targets: (config.targets ?? []).map(normalizeTarget),
  };
}
