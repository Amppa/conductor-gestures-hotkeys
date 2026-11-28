import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./defaults";
import { Binding, Gesture } from "./types";
import { findConflictingBindings, hasEnabledGestureDuplicate } from "./ruleValidation";

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
  it.each([
    ["EdgeTop", "EdgeTopLeftHalf", "EdgeTopRightHalf"],
    ["EdgeBottom", "EdgeBottomLeftHalf", "EdgeBottomRightHalf"],
    ["EdgeLeft", "EdgeLeftTopHalf", "EdgeLeftBottomHalf"],
    ["EdgeRight", "EdgeRightTopHalf", "EdgeRightBottomHalf"],
  ])("checks occupancy on %s per wheel direction", (whole, first, second) => {
    const existing = createBinding("existing", true, { trigger: first, steps: ["WU"] });
    const check = (trigger: string, steps: string[] = ["WU"], bindings = [existing]) =>
      hasEnabledGestureDuplicate(bindings, "candidate", { trigger, steps });
    expect(check(first, ["WU"])).toBe(true);
    expect(check(first, ["WD"])).toBe(false);
    expect(check(whole, ["WU"])).toBe(true);
    expect(check(whole, ["WD"])).toBe(false);
    expect(check(second, ["WU"])).toBe(false);
    expect(check(first, ["WU"], [{ ...existing, enabled: false }])).toBe(false);
    expect(check(first, ["WU"], [{ ...existing, id: "candidate" }])).toBe(false);
    const full = createBinding("full", true, { trigger: whole, steps: ["WU"] });
    expect(check(first, ["WU"], [full])).toBe(true);
    expect(check(first, ["WD"], [full])).toBe(false);
    expect(check(whole, ["WD"], [full])).toBe(false);
  });
  it("rejects enabling a disabled rule that duplicates an enabled gesture", () => {
    const existing = createBinding("existing", true);
    const candidate = createBinding("candidate", false);

    expect(hasEnabledGestureDuplicate([existing], candidate.id, candidate.gesture)).toBe(true);
    expect(findConflictingBindings([existing], candidate.id, candidate.gesture)).toEqual([existing]);
  });

  it("returns overlapping edge rules when whole and half edges conflict", () => {
    const leftHalf = createBinding("left", true, { trigger: "EdgeTopLeftHalf", steps: ["WU"] });
    const rightHalf = createBinding("right", true, { trigger: "EdgeTopRightHalf", steps: ["WU"] });
    const wholeEdge = createBinding("whole", false, { trigger: "EdgeTop", steps: ["WU"] });

    expect(findConflictingBindings([leftHalf, rightHalf, wholeEdge], wholeEdge.id, wholeEdge.gesture)).toEqual([
      leftHalf,
      rightHalf,
    ]);
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

  it("normalizes legacy trigger aliases and step casing before comparing", () => {
    const existing = createBinding("existing", true, { trigger: "RB", steps: ["l"] });
    const candidate = createBinding("new", false, { trigger: "R", steps: ["L"] });

    expect(hasEnabledGestureDuplicate([existing], candidate.id, candidate.gesture)).toBe(true);
  });
});

describe("DEFAULT_CONFIG", () => {
  it("does not include default Left Alt or Left Win remap rules", () => {
    const globalTarget = DEFAULT_CONFIG.targets.find((target) => target.kind === "global");
    const ids = globalTarget?.bindings.map((binding) => binding.id) ?? [];

    expect(ids).not.toContain("g-lalt-to-lwin");
    expect(ids).not.toContain("g-lwin-to-lalt");
  });

  it("assigns swapped top-edge tab rules to the browser group", () => {
    const group = DEFAULT_CONFIG.targets.find((target) => target.id === "group01");
    const globalTarget = DEFAULT_CONFIG.targets.find((target) => target.kind === "global");
    const previousTab = group?.bindings.find((binding) => binding.id === "g-edge-top-prev-tab");
    const nextTab = group?.bindings.find((binding) => binding.id === "g-edge-top-next-tab");
    const closeTab = group?.bindings.find((binding) => binding.id === "b-close-tab");
    const reopenTab = group?.bindings.find((binding) => binding.id === "b-reopen-tab");

    expect(closeTab?.gesture.steps).toEqual(["R", "D"]);
    expect(reopenTab?.gesture.steps).toEqual(["R", "U"]);
    expect(previousTab?.gesture.steps).toEqual(["WU"]);
    expect(nextTab?.gesture.steps).toEqual(["WD"]);
    expect(globalTarget?.bindings.map((binding) => binding.id)).not.toContain(
      "g-edge-top-prev-tab"
    );
    expect(globalTarget?.bindings.map((binding) => binding.id)).not.toContain(
      "g-edge-top-next-tab"
    );
  });
});
