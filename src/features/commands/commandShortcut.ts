import { keyboardEventToTrigger, type KeyboardInputEvent } from "../../domain/triggers/keyboard";

export function captureCommandShortcut(event: KeyboardInputEvent): string | null {
  if (/^(Control|Shift|Alt|Meta)(Left|Right)$/.test(event.code)) return null;
  const trigger = keyboardEventToTrigger(event);
  if (!trigger) return null;
  const match = /^([\^!+#]*)(.+)$/.exec(trigger);
  if (!match) return null;
  const [, modifiers, key] = match;
  return modifiers + (/^[A-Z0-9]$/.test(key) ? key.toLowerCase() : `{${key}}`);
}
