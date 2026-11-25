import type { ActionType } from "../../domain/types";

export interface PresetItem {
  key: string;
  keys: string;
}

export const COMMON_HOTKEYS: PresetItem[] = [
  { key: "presetCloseTab", keys: "^w" },
  { key: "presetReopenTab", keys: "^+t" },
  { key: "presetPrevPage", keys: "!{Left}" },
  { key: "presetNextPage", keys: "!{Right}" },
  { key: "presetRefresh", keys: "{F5}" },
  { key: "presetCopy", keys: "^c" },
  { key: "presetPaste", keys: "^v" },
  { key: "presetShowDesktop", keys: "#d" },
  { key: "presetVolUp", keys: "{Volume_Up}" },
  { key: "presetVolDown", keys: "{Volume_Down}" },
];

export const ACTION_TYPE_LABEL_KEYS: Record<ActionType, string> = {
  keys: "dialogs.typeKeys",
  ahk: "dialogs.typeAhk",
  run: "dialogs.typeRun",
  noop: "dialogs.typeNoop",
  remap: "dialogs.typeRemap",
  mouse: "dialogs.typeMouse",
  wheel: "dialogs.typeWheel",
};
