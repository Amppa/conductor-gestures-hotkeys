import type { KeyboardEvent } from "react";

const MODIFIER_KEYS: Record<string, string> = {
  ControlLeft: "LCtrl",
  ControlRight: "RCtrl",
  ShiftLeft: "LShift",
  ShiftRight: "RShift",
  AltLeft: "LAlt",
  AltRight: "RAlt",
  MetaLeft: "LWin",
  MetaRight: "RWin",
};

const NAMED_KEYS: Record<string, string> = {
  Escape: "Esc",
  Enter: "Enter",
  Space: "Space",
  Tab: "Tab",
  Backspace: "Backspace",
  Delete: "Delete",
  Insert: "Insert",
  Home: "Home",
  End: "End",
  PageUp: "PgUp",
  PageDown: "PgDn",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  ArrowUp: "Up",
  ArrowDown: "Down",
  CapsLock: "CapsLock",
  NumLock: "NumLock",
  ScrollLock: "ScrollLock",
  PrintScreen: "PrintScreen",
  Pause: "Pause",
};

function eventBaseKey(event: KeyboardEvent<HTMLInputElement>): string | null {
  if (MODIFIER_KEYS[event.code]) return MODIFIER_KEYS[event.code];
  if (NAMED_KEYS[event.code]) return NAMED_KEYS[event.code];
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3);
  if (/^Digit[0-9]$/.test(event.code)) return event.code.slice(5);
  if (/^F(?:[1-9]|1[0-9]|2[0-4])$/.test(event.code)) return event.code;
  if (/^Numpad[0-9]$/.test(event.code)) return event.code;

  return null;
}

export function keyboardEventToTrigger(
  event: KeyboardEvent<HTMLInputElement>
): string | null {
  const baseKey = eventBaseKey(event);
  if (!baseKey) return null;
  if (MODIFIER_KEYS[event.code]) return baseKey;

  let prefix = "";
  if (event.ctrlKey) prefix += "^";
  if (event.altKey) prefix += "!";
  if (event.shiftKey) prefix += "+";
  if (event.metaKey) prefix += "#";
  return `${prefix}${baseKey}`;
}

export function formatHotkeyTrigger(trigger: string): string {
  const parts: string[] = [];
  let remaining = trigger;

  while (remaining.length > 0) {
    if (remaining.startsWith("^")) {
      parts.push("Ctrl");
      remaining = remaining.slice(1);
    } else if (remaining.startsWith("!")) {
      parts.push("Alt");
      remaining = remaining.slice(1);
    } else if (remaining.startsWith("+")) {
      parts.push("Shift");
      remaining = remaining.slice(1);
    } else if (remaining.startsWith("#")) {
      parts.push("Win");
      remaining = remaining.slice(1);
    } else {
      break;
    }
  }

  if (remaining) parts.push(remaining);
  return parts.join(" + ");
}
