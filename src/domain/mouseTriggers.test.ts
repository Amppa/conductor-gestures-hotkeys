import { describe, expect, it } from "vitest";
import { normalizeTrigger } from "./triggerNormalization";
import { isKeyboardTrigger } from "./triggerTypes";
import { isGestureIncomplete } from "./bindingRules";
import { parseStrokeInput, validateStrokeInput } from "../features/gestures/gestureSymbols";

describe("mouse trigger contract", () => {
  it("canonicalizes chords independently of press order", () => {
    expect(normalizeTrigger("X1+R")).toBe("R+X1");
    expect(normalizeTrigger("R+L")).toBe("L+R");
    expect(isKeyboardTrigger("R+X1")).toBe(false);
    expect(isKeyboardTrigger("^+A")).toBe(true);
    expect(parseStrokeInput("X1+R, 🡣, 滾輪↑")).toEqual({ trigger: "R+X1", steps: ["D", "WU"] });
  });

  it("rejects left-only and incomplete chords while allowing middle and mixed gestures", () => {
    expect(validateStrokeInput("L, 🡣", "L")).toBe("leftOnlyUnsupported");
    expect(validateStrokeInput("L+R, 🡣", "R")).toBe("unsupportedMouseGesture");
    expect(validateStrokeInput("M, 滾輪↑", "M")).toBe("unsupportedMouseGesture");
    expect(validateStrokeInput("R+R, 🡣", "R")).toBe("invalidStroke");
    expect(isGestureIncomplete({ trigger: "L", steps: ["D"] })).toBe(true);
    expect(isGestureIncomplete({ trigger: "R+X1", steps: [] })).toBe(false);
    expect(validateStrokeInput("X1+R", "R")).toBeNull();
    expect(validateStrokeInput("L+R", "R")).toBeNull();
    expect(validateStrokeInput("X1+R,", "R")).toBe("invalidStroke");
  });
});
