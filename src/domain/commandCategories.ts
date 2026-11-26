import type { Action } from "./types";

export const COMMAND_CATEGORIES = ["keyboardCommands", "systemCommands", "scriptCommands"] as const;
export type CommandCategory = typeof COMMAND_CATEGORIES[number];

export const SYSTEM_COMMANDS: { label: string; type: Action["type"]; value: string }[] = [
  { label: "presetVolUp", type: "keys", value: "{Volume_Up}" },
  { label: "presetVolDown", type: "keys", value: "{Volume_Down}" },
  { label: "presetMute", type: "keys", value: "{Volume_Mute}" },
  { label: "presetPlayPause", type: "keys", value: "{Media_Play_Pause}" },
  { label: "presetMediaNext", type: "keys", value: "{Media_Next}" },
  { label: "presetMediaPrevious", type: "keys", value: "{Media_Prev}" },
  { label: "presetShowDesktop", type: "keys", value: "#d" },
  { label: "presetMinimize", type: "ahk", value: "WinMinimize('A')" },
  { label: "presetMaximize", type: "ahk", value: "WinMaximize('A')" },
  { label: "presetRestore", type: "ahk", value: "WinRestore('A')" },
];

export function getCommandCategory(action: Pick<Action, "type" | "value">): CommandCategory {
  if (SYSTEM_COMMANDS.some((preset) => preset.type === action.type && preset.value.toLowerCase() === action.value.trim().toLowerCase()) ||
      (action.type === "keys" && /^\{(?:Volume_|Media_)[a-z_]+\}$/i.test(action.value.trim())) ||
      action.type === "mouse" || action.type === "wheel") return "systemCommands";
  return action.type === "keys" || action.type === "remap" ? "keyboardCommands" : "scriptCommands";
}
