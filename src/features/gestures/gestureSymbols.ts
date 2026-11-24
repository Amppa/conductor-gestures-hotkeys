/**
 * Gesture and Trigger Display Helpers
 * Formats mouse triggers and direction arrows cleanly with i18n support.
 */

export function formatGestureName(trigger: string, steps: string[], t: any): string {
  const key = normalizeTrigger(trigger);
  const label = t(`triggers.${key}`, { defaultValue: key });
  const button = label.replace(/^[RML] \((.*)\)$/, "$1");
  return button + (steps.length ? " " + steps.map((step) => formatStepSymbol(step, t)).join("") : "");
}

export function formatStepSymbol(step: string, t?: any): string {
  switch (step.toUpperCase()) {
    case "U":
    case "UP":
      return "🡡";
    case "D":
    case "DOWN":
      return "🡣";
    case "L":
    case "LEFT":
      return "🡠";
    case "R":
    case "RIGHT":
      return "🡢";
    case "UL":
    case "UP_LEFT":
      return "🡤";
    case "UR":
    case "UP_RIGHT":
      return "🡥";
    case "DL":
    case "DOWN_LEFT":
      return "🡧";
    case "DR":
    case "DOWN_RIGHT":
      return "🡦";
    case "WU":
    case "WHEEL_UP":
      return t ? t("triggers.wheelUp") : "Wheel↑";
    case "WD":
    case "WHEEL_DOWN":
      return t ? t("triggers.wheelDown") : "Wheel↓";
    default:
      return step;
  }
}

/**
 * Normalizes legacy trigger aliases (e.g. RB, MB, LB, EdgeTopR) to canonical trigger names.
 */
export function normalizeTrigger(trigger: string): string {
  switch (trigger) {
    case "RB":
      return "R";
    case "MB":
      return "M";
    case "LB":
      return "L";
    case "X1B":
      return "X1";
    case "X2B":
      return "X2";
    case "EdgeTopL":
    case "EdgeTopR":
      return "EdgeTop";
    default:
      return trigger;
  }
}

export function formatTriggerSymbol(
  trigger: string,
  t?: any
): string {
  const trig = normalizeTrigger(trigger);
  if (t) {
    return t(`triggers.${trig}`, { defaultValue: trig });
  }

  switch (trig) {
    case "R":
      return "R";
    case "M":
      return "M";
    case "L":
      return "L";
    case "X1":
      return "X1";
    case "X2":
      return "X2";
    default:
      return trig;
  }
}

export function formatGestureLabel(
  trigger: string,
  steps: string[],
  t?: any
): string {
  const normTrig = normalizeTrigger(trigger);
  const isMouse = ["R", "M", "L", "X1", "X2"].includes(normTrig);
  const trig = isMouse ? normTrig : formatTriggerSymbol(normTrig, t);

  if (steps.length === 0) {
    if (isMouse) {
      const clickText = t ? t("triggers.click") : "Click";
      return `${trig} (${clickText})`;
    }
    return trig;
  }

  // Chord wheel or edge wheel
  if (steps[0] === "WU" || steps[0] === "WD") {
    const wheelText = formatStepSymbol(steps[0], t);
    return `${trig} + ${wheelText}`;
  }

  // Direction arrows without space for mouse triggers (e.g. R←, R↓→)
  const stepArrows = steps.map((step) => formatStepSymbol(step, t)).join("");
  return isMouse ? `${trig}${stepArrows}` : `${trig} ${stepArrows}`;
}

/**
 * Parses user-input gesture text (e.g. "R→↘", "→↘", "DR", "R↓→", "R + W↑")
 * into normalized trigger and step array.
 */
export function parseStrokeInput(
  rawInput: string,
  fallbackTrigger: string = "R"
): { trigger: string; steps: string[] } {
  let text = rawInput.trim();
  text = text.replace(/滾輪|wheel/gi, "W");
  const previousArrows = ["🡐", "🡑", "🡒", "🡓", "🡔", "🡕", "🡖", "🡗"];
  const standardArrows = ["←", "↑", "→", "↓", "↖", "↗", "↘", "↙"];
  text = Array.from(text, (character) => {
    const index = previousArrows.indexOf(character);
    return index < 0 ? character : standardArrows[index];
  }).join("");
  const arrowAliases: Record<string, string> = { "🡠": "←", "🡡": "↑", "🡢": "→", "🡣": "↓", "🡤": "↖", "🡥": "↗", "🡦": "↘", "🡧": "↙", "⭠": "←", "⭡": "↑", "⭢": "→", "⭣": "↓" };
  text = Array.from(text, (character) => arrowAliases[character] ?? character).join("");
  let trigger = fallbackTrigger;

  // 1. Check for leading trigger (e.g. "X1:", "X2 ", "R→", "M", etc.)
  const knownTriggers = [
    "CornerTL",
    "CornerTR",
    "CornerBL",
    "CornerBR",
    "EdgeTop",
    "EdgeBottom",
    "EdgeLeft",
    "EdgeRight",
    "X1",
    "X2",
    "R",
    "M",
    "L",
  ];
  for (const kt of knownTriggers) {
    if (text.startsWith(kt)) {
      trigger = kt;
      text = text.slice(kt.length).replace(/^[:\s+]+/, "");
      break;
    }
  }

  // 2. Parse remaining steps
  const steps: string[] = [];
  let i = 0;
  while (i < text.length) {
    // Skip whitespace, colons, plus, commas
    if (/[\s,:+]/.test(text[i])) {
      i++;
      continue;
    }

    // Check two-character tokens first: UL, UR, DL, DR, WU, WD, W↑, W↓
    const twoChars = text.slice(i, i + 2).toUpperCase();
    if (twoChars === "W↑" || twoChars === "WU") {
      steps.push("WU");
      i += 2;
      continue;
    }
    if (twoChars === "W↓" || twoChars === "WD") {
      steps.push("WD");
      i += 2;
      continue;
    }
    if (
      twoChars === "UL" ||
      twoChars === "UR" ||
      twoChars === "DL" ||
      twoChars === "DR"
    ) {
      steps.push(twoChars);
      i += 2;
      continue;
    }

    // Single character tokens: arrows and letters
    const ch = text[i];
    switch (ch) {
      case "↑":
        steps.push("U");
        break;
      case "↓":
        steps.push("D");
        break;
      case "←":
        steps.push("L");
        break;
      case "→":
        steps.push("R");
        break;
      case "↖":
        steps.push("UL");
        break;
      case "↗":
        steps.push("UR");
        break;
      case "↙":
        steps.push("DL");
        break;
      case "↘":
        steps.push("DR");
        break;
      case "U":
      case "u":
        steps.push("U");
        break;
      case "D":
      case "d":
        steps.push("D");
        break;
      case "L":
      case "l":
        steps.push("L");
        break;
      case "R":
      case "r":
        steps.push("R");
        break;
    }
    i++;
  }

  return { trigger, steps };
}
