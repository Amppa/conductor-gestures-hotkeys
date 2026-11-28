import { normalizeTrigger } from "./triggerNormalization";
import { Binding, Gesture } from "./types";
import { screenEdgeSlots } from "./triggers/screen";

type GestureShape = Pick<Gesture, "trigger" | "steps">;

function stepSignature(steps: string[] = []): string {
  return steps.map((step) => step.trim().toUpperCase()).join(",");
}

/**
 * Finds all enabled rules in the same scope whose trigger or screen-edge
 * slot conflicts with the candidate gesture for the same step signature.
 */
export function findConflictingBindings(
  bindings: Binding[],
  bindingId: string,
  gesture: GestureShape
): Binding[] {
  const trigger = normalizeTrigger(gesture.trigger);
  const steps = stepSignature(gesture.steps);
  const slots = screenEdgeSlots(trigger);

  return bindings.filter((other) => {
    if (other.id === bindingId || !other.enabled) return false;
    const otherTrigger = normalizeTrigger(other.gesture.trigger);
    if (stepSignature(other.gesture.steps) !== steps) return false;
    return otherTrigger === trigger || (slots & screenEdgeSlots(otherTrigger)) !== 0;
  });
}

export function hasEnabledGestureDuplicate(
  bindings: Binding[],
  bindingId: string,
  gesture: GestureShape
): boolean {
  return findConflictingBindings(bindings, bindingId, gesture).length > 0;
}
