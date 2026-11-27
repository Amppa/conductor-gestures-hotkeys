import type { ActionType } from "../../domain/types";

export const ACTION_TYPE_LABEL_KEYS: Record<ActionType, string> = {
  keys: "dialogs.typeKeys",
  ahk: "dialogs.typeAhk",
  run: "dialogs.typeRun",
  noop: "dialogs.typeNoop",
  remap: "dialogs.typeRemap",
  mouse: "dialogs.typeMouse",
  wheel: "dialogs.typeWheel",
};
