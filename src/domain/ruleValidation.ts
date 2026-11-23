import { Binding, Gesture } from "./types";

type GestureShape = Pick<Gesture, "trigger" | "steps">;

export function hasEnabledGestureDuplicate(
  bindings: Binding[],
  bindingId: string,
  gesture: GestureShape
): boolean {
  return bindings.some(
    (other) =>
      other.id !== bindingId &&
      other.enabled &&
      other.gesture.trigger === gesture.trigger &&
      other.gesture.steps.join(",") === gesture.steps.join(",")
  );
}
