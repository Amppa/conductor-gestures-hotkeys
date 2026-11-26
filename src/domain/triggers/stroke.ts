export const TRIGGER_INPUT_ERRORS = ["invalidStroke", "leftOnlyUnsupported", "singleClickUnsupported", "unsupportedMouseGesture", "wrongMousePage"] as const;
export type TriggerInputError = typeof TRIGGER_INPUT_ERRORS[number];

export interface StrokeInput {
  trigger: string;
  steps: string[];
  error: TriggerInputError | null;
}

const ARROWS: Record<string, string> = {
  "←": "L", "↑": "U", "→": "R", "↓": "D",
  "↖": "UL", "↗": "UR", "↙": "DL", "↘": "DR",
  "🡐": "L", "🡑": "U", "🡒": "R", "🡓": "D",
  "🡔": "UL", "🡕": "UR", "🡖": "DR", "🡗": "DL",
  "🡠": "L", "🡡": "U", "🡢": "R", "🡣": "D",
  "🡤": "UL", "🡥": "UR", "🡦": "DR", "🡧": "DL",
  "⭠": "L", "⭡": "U", "⭢": "R", "⭣": "D",
};

export function parseSteps(raw: string): { steps: string[]; error: TriggerInputError | null } {
  const steps: string[] = [];
  if (/[,+:]\s*([,+:]|$)/.test(raw)) return { steps, error: "invalidStroke" };
  let text = raw.trim().replace(/^[:,+]\s*/, "").replace(/滾輪|wheel/gi, "W");
  // Consume wheel arrows first; separate arrow glyphs must remain separate steps.
  text = text.replace(/W↑/gi, "WU").replace(/W↓/gi, "WD");
  while (text) {
    const character = Array.from(text)[0];
    const arrow = ARROWS[character];
    const token = arrow ? character : /^(WU|WD|UL|UR|DL|DR|[UDLR])/i.exec(text)?.[0];
    if (!token) return { steps, error: "invalidStroke" };
    steps.push(arrow ?? token.toUpperCase());
    text = text.slice(token.length).replace(/^\s*[,+:]?\s*/, "");
  }
  return { steps, error: null };
}
