// Maps AHK Send syntax to user-friendly hotkey labels

const SPECIAL_KEYS_MAP: Record<string, string> = {
  enter: "{Enter}",
  esc: "{Escape}",
  escape: "{Escape}",
  space: "{Space}",
  tab: "{Tab}",
  backspace: "{Backspace}",
  delete: "{Delete}",
  del: "{Delete}",
  insert: "{Insert}",
  home: "{Home}",
  end: "{End}",
  pageup: "{PgUp}",
  pgup: "{PgUp}",
  pagedown: "{PgDn}",
  pgdn: "{PgDn}",
  left: "{Left}",
  right: "{Right}",
  up: "{Up}",
  down: "{Down}",
  volumeup: "{Volume_Up}",
  volumedown: "{Volume_Down}",
  volumemute: "{Volume_Mute}",
  mediaplaypause: "{Media_Play_Pause}",
  medianext: "{Media_Next}",
  mediaprev: "{Media_Prev}",
};

// Converts AHK syntax back to friendly format (e.g. "^+t" -> "Ctrl+Shift+T")
export function fromAhkKey(ahkStr: string): string {
  if (!ahkStr) return "";
  const parts: string[] = [];
  let remaining = ahkStr;

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

  // Check special keys enclosed in braces {Key}
  if (remaining.startsWith("{") && remaining.endsWith("}")) {
    const raw = remaining.slice(1, -1);
    for (const [keyName, ahkCode] of Object.entries(SPECIAL_KEYS_MAP)) {
      if (ahkCode.toLowerCase() === remaining.toLowerCase()) {
        parts.push(keyName.charAt(0).toUpperCase() + keyName.slice(1));
        return parts.join("+");
      }
    }
    parts.push(raw);
    return parts.join("+");
  }

  if (remaining.length > 0) {
    parts.push(remaining.toUpperCase());
  }

  return parts.join("+");
}
