// Two-way key mapping between user-friendly hotkey strings and AHK Send syntax

export const SPECIAL_KEYS_MAP: Record<string, string> = {
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

// Converts user-friendly format (e.g. "Ctrl+Shift+T") to AHK format ("^+t")
export function toAhkKey(hotkeyStr: string): string {
  if (!hotkeyStr) return "";
  const parts = hotkeyStr.split("+").map((p) => p.trim());
  let ahkPrefix = "";
  let baseKey = "";

  for (const part of parts) {
    switch (part.toLowerCase()) {
      case "ctrl":
      case "control":
        ahkPrefix += "^";
        break;
      case "alt":
        ahkPrefix += "!";
        break;
      case "shift":
        ahkPrefix += "+";
        break;
      case "win":
      case "windows":
      case "meta":
        ahkPrefix += "#";
        break;
      default:
        baseKey = part;
        break;
    }
  }

  const special = SPECIAL_KEYS_MAP[baseKey.toLowerCase()];
  if (special) {
    return `${ahkPrefix}${special}`;
  }

  // Normal letters or digits
  return `${ahkPrefix}${baseKey.toLowerCase()}`;
}

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
