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

export function formatTriggerSymbol(
  trigger: string,
  t?: any
): string {
  if (t) {
    return t(`triggers.${trigger}`, { defaultValue: trigger });
  }

  switch (trigger) {
    case "RB":
    case "R":
      return "R";
    case "MB":
    case "M":
      return "M";
    case "LB":
    case "L":
      return "L";
    case "X1":
    case "X1B":
      return "X1";
    case "X2":
    case "X2B":
      return "X2";
    default:
      return trigger;
  }
}

export function formatGestureLabel(
  trigger: string,
  steps: string[],
  t?: any
): string {
  const trig = formatTriggerSymbol(trigger, t);
  if (steps.length === 0) {
    const clickText = t ? t("triggers.click") : "Click";
    return `${trig} (${clickText})`;
  }
  // Chord wheel or edge wheel
  if (steps[0] === "WU" || steps[0] === "WD") {
    const wheelText =
      steps[0] === "WU"
        ? t
          ? t("triggers.wheelUp")
          : "W↑"
        : t
        ? t("triggers.wheelDown")
        : "W↓";
    return `${trig} + ${wheelText}`;
  }
  // Direction arrows
  const stepArrows = steps.map(formatStepSymbol).join("");
  return `${trig} ${stepArrows}`;
}
