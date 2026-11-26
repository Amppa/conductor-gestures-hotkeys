import { describe, expect, it } from "vitest";
import { getCommandCategory, SYSTEM_COMMANDS } from "./commandCategories";
describe("command categories", () => {
  it("classifies system commands by purpose instead of execution type", () => {
    for (const preset of SYSTEM_COMMANDS) expect(getCommandCategory(preset)).toBe("systemCommands");
    expect(getCommandCategory({ type: "keys", value: "^c" })).toBe("keyboardCommands");
    expect(getCommandCategory({ type: "keys", value: "{Media_Stop}" })).toBe("systemCommands");
  });
  it("keeps scripts and other operations in the script catalog", () => {
    for (const type of ["ahk", "run", "noop"] as const) {
      expect(getCommandCategory({ type, value: "custom" })).toBe("scriptCommands");
    }
  });
  it("places modifier remaps in keyboard commands", () => {
    for (const value of ["LWin", "LAlt", "RCtrl"]) {
      expect(getCommandCategory({ type: "remap", value })).toBe("keyboardCommands");
    }
  });
});
