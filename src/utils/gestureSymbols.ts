/**
 * Gesture and Trigger Display Helpers
 * Formats mouse triggers and direction arrows cleanly, e.g. "R(右鍵) ↑←", "R(右鍵) →"
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

export function formatTriggerSymbol(trigger: string): string {
  switch (trigger) {
    case "RB":
    case "R":
      return "R(右鍵)";
    case "MB":
    case "M":
      return "M(中鍵)";
    case "LB":
    case "L":
      return "L(左鍵)";
    case "X1":
    case "X1B":
      return "X1(側鍵1)";
    case "X2":
    case "X2B":
      return "X2(側鍵2)";
    case "EdgeTopL":
      return "螢幕頂部左側";
    case "EdgeTopR":
      return "螢幕頂部右側";
    case "EdgeLeft":
      return "螢幕左側邊緣";
    case "EdgeRight":
      return "螢幕右側邊緣";
    case "CornerTL":
      return "左上觸控角(TL)";
    case "CornerTR":
      return "右上觸控角(TR)";
    case "CornerBL":
      return "左下觸控角(BL)";
    case "CornerBR":
      return "右下觸控角(BR)";
    default:
      return trigger;
  }
}

export function formatGestureLabel(trigger: string, steps: string[]): string {
  const trig = formatTriggerSymbol(trigger);
  if (steps.length === 0) {
    return `${trig} (單擊)`;
  }
  // If trigger is a Chord Wheel or Edge Wheel (WU / WD)
  if (steps[0] === "WU" || steps[0] === "WD") {
    const wheelText = steps[0] === "WU" ? "滾輪上(W↑)" : "滾輪下(W↓)";
    return `${trig} + ${wheelText}`;
  }
  // Direction arrows directly adjacent, e.g. "R(右鍵) ↑←"
  const stepArrows = steps.map(formatStepSymbol).join("");
  return `${trig} ${stepArrows}`;
}
