import { hasEnabledGestureDuplicate } from "./ruleValidation";
import { Action, Binding, Gesture, Target } from "./types";

const EMPTY_STEP_ALLOWED_TRIGGERS = new Set(["Insert", "LAlt", "LWin", "X1", "X2"]);

const STEP_REQUIRED_TRIGGERS = new Set([
  "R",
  "M",
  "L",
  "EdgeTop",
  "EdgeBottom",
  "EdgeLeft",
  "EdgeRight",
]);

/**
 * A gesture needs at least one direction unless it is a corner, a key, or a
 * keyboard hotkey. Keyboard triggers never carry direction steps.
 */
export function isGestureIncomplete(
  gesture?: Pick<Gesture, "trigger" | "steps">,
): boolean {
  if (!gesture || !gesture.trigger) {
    return true;
  }

  const { trigger } = gesture;
  const allowsEmptySteps =
    trigger.startsWith("Corner") ||
    EMPTY_STEP_ALLOWED_TRIGGERS.has(trigger) ||
    !STEP_REQUIRED_TRIGGERS.has(trigger);

  if (allowsEmptySteps) {
    return false;
  }

  return !gesture.steps || gesture.steps.length === 0;
}

export function isActionIncomplete(action?: Action): boolean {
  if (!action) {
    return true;
  }
  if (action.type === "noop" || action.id === "act-noop") {
    return false;
  }
  return !action.value || !action.value.trim();
}

/**
 * Reports a duplicate only for enabled rules, matching what the engine emits.
 */
export function isDuplicateGesture(target: Target, binding: Binding): boolean {
  return (
    binding.enabled &&
    !isGestureIncomplete(binding.gesture) &&
    hasEnabledGestureDuplicate(target.bindings, binding.id, binding.gesture)
  );
}

export function isBindingInvalid(target: Target, binding: Binding): boolean {
  return (
    isGestureIncomplete(binding.gesture) ||
    isActionIncomplete(binding.action) ||
    isDuplicateGesture(target, binding)
  );
}

/**
 * A rule becomes active only when both halves are complete and no other
 * enabled rule in the same scope already owns the gesture.
 */
export function shouldEnableBinding(
  target: Target,
  bindingId: string,
  gesture: Gesture,
  action: Action,
): boolean {
  return (
    !isGestureIncomplete(gesture) &&
    !isActionIncomplete(action) &&
    !hasEnabledGestureDuplicate(target.bindings, bindingId, gesture)
  );
}
