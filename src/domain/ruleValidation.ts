import { normalizeTrigger } from "./triggerNormalization";
import { Binding, Gesture } from "./types";

type GestureShape = Pick<Gesture, "trigger" | "steps">;

function stepSignature(steps: string[] = []): string {
  return steps.map((step) => step.trim().toUpperCase()).join(",");
}

/**
 * Reports whether another enabled rule in the same scope owns this gesture.
 * Triggers and steps are normalized first so legacy aliases (e.g. "RB") are
 * compared against their canonical form, matching the Rust validator.
 */
export function hasEnabledGestureDuplicate(
  bindings: Binding[],
  bindingId: string,
  gesture: GestureShape
): boolean {
  const trigger = normalizeTrigger(gesture.trigger);
  const steps = stepSignature(gesture.steps);

  return bindings.some(
    (other) =>
      other.id !== bindingId &&
      other.enabled &&
      normalizeTrigger(other.gesture.trigger) === trigger &&
      stepSignature(other.gesture.steps) === steps
  );
}
