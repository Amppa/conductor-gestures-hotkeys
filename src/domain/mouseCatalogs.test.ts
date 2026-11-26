import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./defaults";
import { getTriggerCategory, mouseTriggerKind } from "./triggerTypes";
import { removeUnsupportedMouseTriggers } from "./configNormalization";
import { parseMouseInput } from "./triggers/mouse";

describe("separate mouse catalogs", () => {
  it.each(["R", "X1", "X2"])("accepts %s with directions or one wheel operation", (trigger) => {
    expect(mouseTriggerKind({ trigger, steps: ["D", "R"] })).toBe("direction");
    expect(mouseTriggerKind({ trigger, steps: ["WU"] })).toBe("wheel");
    expect(mouseTriggerKind({ trigger, steps: ["D", "WU"] })).toBeNull();
    expect(mouseTriggerKind({ trigger, steps: ["WU", "WD"] })).toBeNull();
  });

  it("classifies button-only input independently from gestures", () => {
    expect(mouseTriggerKind({ trigger: "M", steps: ["D"] })).toBeNull();
    expect(mouseTriggerKind({ trigger: "M", steps: ["WU"] })).toBeNull();
    expect(mouseTriggerKind({ trigger: "M+R", steps: [] })).toBe("buttons");
    for (const trigger of ["X1", "X2", "L+R", "R+X1"]) {
      expect(getTriggerCategory({ id: trigger, trigger, steps: [] })).toBe("mouseButtons");
    }
    expect(getTriggerCategory({ id: "x1-down", trigger: "X1", steps: ["D"] })).toBe("gestures");
    expect(parseMouseInput("X1+R, 🡣").error).toBe("unsupportedMouseGesture");
    expect(parseMouseInput("R, 🡣, 滾輪↑").error).toBe("unsupportedMouseGesture");
    expect(parseMouseInput("R, 滾輪↑").error).toBeNull();
  });

  it("contains the requested default mouse presets without changing existing rules", () => {
    const signatures = DEFAULT_CONFIG.gestureTemplates.map((template) => `${template.trigger}:${template.steps.join(",")}`);
    expect(signatures).not.toContain("R:D,R");
    expect(signatures).not.toContain("R:U,L");
    for (const signature of ["R:R,D", "R:R,U", "R:L,D", "R:L,U", "R+X1:", "R+X2:"]) expect(signatures).toContain(signature);
  });

  it("removes unsupported templates and enabled or disabled rules without modifying the source", () => {
    const invalid = { id: "mixed", trigger: "R", steps: ["D", "WU"] };
    const chord = { id: "chord", trigger: "R+X1", steps: ["D"] };
    const config = { ...DEFAULT_CONFIG, gestureTemplates: [...DEFAULT_CONFIG.gestureTemplates, invalid, chord],
      targets: DEFAULT_CONFIG.targets.map((target) => ({ ...target, bindings: [
        ...target.bindings,
        { id: "bad-on", enabled: true, gesture: invalid, action: DEFAULT_CONFIG.actionTemplates[0] },
        { id: "bad-off", enabled: false, gesture: chord, action: DEFAULT_CONFIG.actionTemplates[0] },
      ] })),
    };
    const cleaned = removeUnsupportedMouseTriggers(config);
    expect(cleaned.gestureTemplates).toEqual(DEFAULT_CONFIG.gestureTemplates);
    expect(cleaned.targets.map((target) => target.bindings)).toEqual(DEFAULT_CONFIG.targets.map((target) => target.bindings));
    expect(config.gestureTemplates).toContain(invalid);
  });
});
