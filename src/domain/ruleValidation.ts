import { normalizeTrigger } from "./triggerNormalization";
import { Binding, Gesture } from "./types";
import { screenEdgeSlots } from "./triggers/screen";

type GestureShape = Pick<Gesture, "trigger" | "steps">;

function stepSignature(steps: string[] = []): string {
  return steps.map((step) => step.trim().toUpperCase()).join(",");
}

/**
 * Reports duplicate gestures or overlapping edge slots for the same step
 * signature (e.g. "WU" vs "WD" do not conflict) within a scope.
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
  const slots = screenEdgeSlots(trigger);

  return bindings.some((other) => {
    if (other.id === bindingId || !other.enabled) return false;
    const otherTrigger = normalizeTrigger(other.gesture.trigger);
    if (stepSignature(other.gesture.steps) !== steps) return false;
    return otherTrigger === trigger || (slots & screenEdgeSlots(otherTrigger)) !== 0;
  });
}
