/**
 * Gesture and Trigger Display Helpers
 * Formats mouse triggers and direction arrows cleanly with i18n support.
 */

export function formatStepSymbol(step: string): string {
  switch (step.toUpperCase()) {
    case "U":
    case "UP":
      return "↑";
    case "D":
    case "DOWN":
      return "↓";
    case "L":
    case "LEFT":
      return "←";
    case "R":
    case "RIGHT":
      return "→";
    case "UL":
    case "UP_LEFT":
      return "↖";
    case "UR":
    case "UP_RIGHT":
      return "↗";
    case "DL":
    case "DOWN_LEFT":
      return "↙";
    case "DR":
    case "DOWN_RIGHT":
      return "↘";
    case "WU":
    case "WHEEL_UP":
      return "W↑";
    case "WD":
    case "WHEEL_DOWN":
      return "W↓";
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
    const wheelText = steps[0] === "WU" ? "W↑" : "W↓";
    return `${trig} + ${wheelText}`;
  }

  // Direction arrows without space for mouse triggers (e.g. R←, R↓→)
  const stepArrows = steps.map(formatStepSymbol).join("");
  return isMouse ? `${trig}${stepArrows}` : `${trig} ${stepArrows}`;
}
