import { describe, expect, it } from "vitest";
import { keyboardEventToTrigger, formatHotkeyTrigger } from "./hotkeyTrigger";

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
    ["Minus", "-"], ["Equal", "="], ["BracketLeft", "["], ["BracketRight", "]"],
    ["Backslash", "\\"], ["Semicolon", ";"], ["Quote", "'"],
    ["Comma", ","], ["Period", "."], ["Slash", "/"],
  ])("captures and formats symbol key %s with modifiers", (code, key) => {
    expect(keyboardEventToTrigger(keyEvent(code))).toBe(key);
    const trigger = keyboardEventToTrigger({ ...keyEvent(code), ctrlKey: true, shiftKey: true });
    expect(trigger).toBe(`^+${key}`);
    expect(formatHotkeyTrigger(trigger!)).toBe(`Ctrl + Shift + ${key}`);
  });
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
