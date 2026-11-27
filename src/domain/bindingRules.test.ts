import { describe, expect, it } from "vitest";
import {
  isActionIncomplete,
  isDuplicateGesture,
  isGestureIncomplete,
  shouldEnableBinding,
} from "./bindingRules";
import { Action, Binding, Gesture, Target } from "./types";

function binding(id: string, enabled: boolean, gesture: Gesture, action: Action): Binding {
  return { id, enabled, gesture, action };
}

const keysAction: Action = { id: "action-keys", name: "Keys", type: "keys", value: "^w" };
const noopAction: Action = { id: "act-noop", name: "No-op", type: "noop", value: "" };
const rightLeft: Gesture = { id: "g-left", name: "Left", trigger: "R", steps: ["L"] };

function targetWith(bindings: Binding[]): Target {
  return {
    id: "global",
    name: "Global",
    enabled: true,
    kind: "global",
    executables: [],
    bindings,
  };
}

describe("isGestureIncomplete", () => {
  it("requires a direction for mouse gestures", () => {
    expect(isGestureIncomplete({ trigger: "R", steps: [] })).toBe(true);
    expect(isGestureIncomplete({ trigger: "R", steps: ["L"] })).toBe(false);
  });

  it("allows empty steps for corners, side buttons and keyboard triggers", () => {
    expect(isGestureIncomplete({ trigger: "CornerTL", steps: [] })).toBe(false);
    expect(isGestureIncomplete({ trigger: "Insert", steps: [] })).toBe(false);
    expect(isGestureIncomplete({ trigger: "^c", steps: [] })).toBe(false);
  });

  it("requires wheel steps for whole and half screen edges", () => {
    expect(isGestureIncomplete({ trigger: "EdgeTop", steps: [] })).toBe(true);
    expect(isGestureIncomplete({ trigger: "EdgeTopLeftHalf", steps: [] })).toBe(true);
    expect(isGestureIncomplete({ trigger: "EdgeRightBottomHalf", steps: [] })).toBe(true);
    expect(isGestureIncomplete({ trigger: "EdgeTopLeftHalf", steps: ["WU"] })).toBe(false);
  });

  it("treats a missing trigger as incomplete", () => {
    expect(isGestureIncomplete(undefined)).toBe(true);
    expect(isGestureIncomplete({ trigger: "", steps: [] })).toBe(true);
  });
});

describe("isActionIncomplete", () => {
  it("accepts no-op actions without a value", () => {
    expect(isActionIncomplete(noopAction)).toBe(false);
  });

  it("rejects blank values for real actions", () => {
    expect(isActionIncomplete({ ...keysAction, value: "" })).toBe(true);
    expect(isActionIncomplete({ ...keysAction, value: "   " })).toBe(true);
    expect(isActionIncomplete(keysAction)).toBe(false);
  });
});

describe("shouldEnableBinding", () => {
  it("enables a complete rule without duplicates", () => {
    expect(shouldEnableBinding(targetWith([]), "new", rightLeft, keysAction)).toBe(true);
  });

  it("rejects a duplicate of another enabled rule", () => {
    const existing = binding("existing", true, rightLeft, keysAction);
    expect(
      shouldEnableBinding(targetWith([existing]), "new", rightLeft, keysAction),
    ).toBe(false);
  });

  it("allows the same gesture when the other rule is disabled", () => {
    const existing = binding("existing", false, rightLeft, keysAction);
    expect(
      shouldEnableBinding(targetWith([existing]), "new", rightLeft, keysAction),
    ).toBe(true);
  });
});

describe("isDuplicateGesture", () => {
  it("only reports duplicates for enabled bindings", () => {
    const existing = binding("existing", true, rightLeft, keysAction);
    const duplicate = binding("duplicate", true, rightLeft, keysAction);
    const disabled = binding("disabled", false, rightLeft, keysAction);

    expect(isDuplicateGesture(targetWith([existing, duplicate]), duplicate)).toBe(true);
    expect(isDuplicateGesture(targetWith([existing, disabled]), disabled)).toBe(false);
  });
});
