import { describe, expect, it } from "vitest";
import { captureCommandShortcut } from "./commandShortcut";

const event = { code: "KeyC", ctrlKey: false, altKey: false, shiftKey: false, metaKey: false };
describe("captureCommandShortcut", () => {
  it("ignores standalone modifiers", () => {
    expect(captureCommandShortcut({ ...event, code: "ControlLeft", ctrlKey: true })).toBeNull();
  });
  it("captures one shortcut in Send syntax", () => {
    expect(captureCommandShortcut({ ...event, ctrlKey: true })).toBe("^c");
    expect(captureCommandShortcut({ ...event, code: "Tab", altKey: true })).toBe("!{Tab}");
    expect(captureCommandShortcut({ ...event, code: "Equal", shiftKey: true })).toBe("+{=}");
    expect(captureCommandShortcut({ ...event, code: "NumpadEnter" })).toBe("{NumpadEnter}");
  });
});
