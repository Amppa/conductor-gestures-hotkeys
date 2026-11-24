import { describe, expect, it } from "vitest";
import { keyboardEventToTrigger } from "./hotkeyTrigger";

function keyEvent(code: string): React.KeyboardEvent<HTMLInputElement> {
  return {
    code,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
  } as React.KeyboardEvent<HTMLInputElement>;
}

describe("keyboardEventToTrigger", () => {
  it.each([
    ["Numpad0", "Numpad0"],
    ["Numpad9", "Numpad9"],
    ["NumpadDivide", "NumpadDiv"],
    ["NumpadMultiply", "NumpadMult"],
    ["NumpadSubtract", "NumpadSub"],
    ["NumpadAdd", "NumpadAdd"],
    ["NumpadDecimal", "NumpadDot"],
    ["NumpadEnter", "NumpadEnter"],
  ])("captures %s as the AutoHotkey key %s", (code, trigger) => {
    expect(keyboardEventToTrigger(keyEvent(code))).toBe(trigger);
  });
});
