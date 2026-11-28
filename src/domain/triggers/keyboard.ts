export interface KeyboardInputEvent {
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

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
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
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
  NumpadDivide: "NumpadDiv",
  NumpadMultiply: "NumpadMult",
  NumpadSubtract: "NumpadSub",
  NumpadAdd: "NumpadAdd",
  NumpadDecimal: "NumpadDot",
  NumpadEnter: "NumpadEnter",
};

function eventBaseKey(event: KeyboardInputEvent): string | null {
  if (MODIFIER_KEYS[event.code]) return MODIFIER_KEYS[event.code];
  if (NAMED_KEYS[event.code]) return NAMED_KEYS[event.code];
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3);
  if (/^Digit[0-9]$/.test(event.code)) return event.code.slice(5);
  if (/^F(?:[1-9]|1[0-9]|2[0-4])$/.test(event.code)) return event.code;
  if (/^Numpad[0-9]$/.test(event.code)) return event.code;

  return null;
}

export function keyboardEventToTrigger(
  event: KeyboardInputEvent
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

const MODIFIER_VALUES = new Set<string>(Object.values(MODIFIER_KEYS));

export function isModifierTrigger(trigger: string): boolean {
  return MODIFIER_VALUES.has(trigger);
}

export function resolveCapturedHotkey(
  prevTrigger: string,
  captured: string,
  elapsedMs: number,
  windowMs = 500,
): string {
  if (
    isModifierTrigger(captured) &&
    prevTrigger === captured &&
    elapsedMs >= 0 &&
    elapsedMs <= windowMs
  ) {
    return `${captured}*2`;
  }
  return captured;
}

export function formatHotkeyTrigger(trigger: string): string {
  const isDoubleTap = trigger.endsWith("*2");
  const baseTrigger = isDoubleTap ? trigger.slice(0, -2) : trigger;
  const parts: string[] = [];
  let remaining = baseTrigger;

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
  const formatted = parts.join(" + ");
  return isDoubleTap && formatted ? `${formatted} × 2` : formatted;
}
