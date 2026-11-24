import { AppConfig, Binding, Gesture, Target } from "./types";

/**
 * Maps legacy trigger aliases to their canonical token.
 * Persisted direction tokens and canonical triggers are returned unchanged.
 */
export function normalizeTrigger(trigger: string): string {
  switch (trigger) {
    case "RB":
      return "R";
    case "MB":
      return "M";
    case "LB":
      return "L";
    case "X1B":
      return "X1";
    case "X2B":
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
