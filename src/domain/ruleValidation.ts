import { normalizeTrigger } from "./triggerNormalization";
import { Binding, Gesture } from "./types";
import { screenEdgeSlots } from "./triggers/screen";

type GestureShape = Pick<Gesture, "trigger" | "steps">;

function stepSignature(steps: string[] = []): string {
  return steps.map((step) => step.trim().toUpperCase()).join(",");
}

/**
 * Reports duplicate gestures or overlapping edge slots in the same scope.
 * Half edges reserve their slot regardless of wheel direction; whole edges
 * retain separate wheel rules but cannot share slots with half edges.
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
      (((trigger.endsWith("Half") || other.gesture.trigger.endsWith("Half")) &&
        (screenEdgeSlots(normalizeTrigger(other.gesture.trigger)) & screenEdgeSlots(trigger)) !== 0) ||
        (normalizeTrigger(other.gesture.trigger) === trigger && stepSignature(other.gesture.steps) === steps))
  );
}
