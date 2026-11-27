import { keyboardEventToTrigger, type KeyboardInputEvent } from "../../domain/triggers/keyboard";

type ShortcutModifier = "^" | "!" | "+" | "#";
const MODIFIER_ORDER: ShortcutModifier[] = ["^", "!", "+", "#"];

// Only include keys that cannot be captured reliably via keydown in Windows WebView
// (OS-intercepted keys and standalone modifiers).
export const SPECIAL_SHORTCUT_KEYS = [
  { label: "LWin", value: "{LWin}" },
  { label: "RWin", value: "{RWin}" },
  { label: "LAlt", value: "{LAlt}" },
  { label: "LCtrl", value: "{LCtrl}" },
  { label: "LShift", value: "{LShift}" },
  { label: "PrintScreen", value: "{PrintScreen}" },
  { label: "Alt + Tab", value: "!{Tab}" },
] as const;

export function normalizeShortcutValue(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const { modifiers, baseKey } = parseShortcutValue(trimmed);
  if (!baseKey) return "";
  // Bare multi-character key names (e.g. legacy remap "LWin") must be braced for AHK Send.
  const normalizedBase =
    baseKey.length > 1 && !baseKey.startsWith("{") ? `{${baseKey}}` : baseKey;
  return `${modifiers.join("")}${normalizedBase}`;
}

export function parseShortcutValue(ahkValue: string): {
  modifiers: ShortcutModifier[];
  baseKey: string;
} {
  let rest = ahkValue.trim();
  const seen = new Set<ShortcutModifier>();
  while (rest.length > 0) {
    const ch = rest[0] as ShortcutModifier;
    if (MODIFIER_ORDER.includes(ch)) {
      seen.add(ch);
      rest = rest.slice(1);
    } else {
      break;
    }
  }
  const modifiers = MODIFIER_ORDER.filter((mod) => seen.has(mod));
  return { modifiers, baseKey: rest };
}

export function hasShortcutBaseKey(ahkValue: string): boolean {
  return parseShortcutValue(ahkValue).baseKey.length > 0;
}

export function captureCommandShortcut(event: KeyboardInputEvent): string | null {
  if (/^(Control|Shift|Alt|Meta)(Left|Right)$/.test(event.code)) return null;
  const trigger = keyboardEventToTrigger(event);
  if (!trigger) return null;
  const match = /^([\^!+#]*)(.+)$/.exec(trigger);
  if (!match) return null;
  const [, modifiers, key] = match;
  return modifiers + (/^[A-Z0-9]$/.test(key) ? key.toLowerCase() : `{${key}}`);
}
