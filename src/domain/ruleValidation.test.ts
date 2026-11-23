import { describe, expect, it } from "vitest";
import { Binding, Gesture } from "./types";
import { hasEnabledGestureDuplicate } from "./ruleValidation";

function createBinding(id: string, enabled: boolean, gesture: Partial<Gesture> = {}): Binding {
  return {
    id,
    enabled,
    gesture: {
      id: `gesture-${id}`,
      name: "Test gesture",
      trigger: "R",
      steps: ["L"],
      ...gesture,
    },
    action: { id: `action-${id}`, name: "Test action", type: "noop", value: "" },
  };
}

describe("hasEnabledGestureDuplicate", () => {
  it("rejects enabling a disabled rule that duplicates an enabled gesture", () => {
    const existing = createBinding("existing", true);
    const candidate = createBinding("candidate", false);

    expect(hasEnabledGestureDuplicate([existing], candidate.id, candidate.gesture)).toBe(true);
  });

  it("allows a duplicate gesture when the other rule is disabled", () => {
    const existing = createBinding("existing", false);

    expect(hasEnabledGestureDuplicate([existing], "new", existing.gesture)).toBe(false);
  });

  it("allows different gesture paths using the same trigger", () => {
    const existing = createBinding("existing", true, { steps: ["L"] });
    const candidate = createBinding("new", false, { steps: ["R"] });

    expect(hasEnabledGestureDuplicate([existing], candidate.id, candidate.gesture)).toBe(false);
  });
});
