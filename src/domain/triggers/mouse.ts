import { normalizeTrigger } from "../triggerNormalization";
import { isMouseTrigger } from "../triggerTypes";
import { parseSteps, StrokeInput } from "./stroke";

export function parseMouseInput(raw: string, fallback = "R"): StrokeInput {
  const text = raw.trim();
  const source = /^(?:X[12]|[LMR])(?:\+(?:X[12]|[LMR]))*/.exec(text)?.[0];
  const trigger = normalizeTrigger(source ?? fallback);
  const parsed = parseSteps(source ? text.slice(source.length) : text);
  let error = parsed.error;
  if (!text || !isMouseTrigger(trigger)) error = "invalidStroke";
  else if (source && new Set(source.split("+")).size !== source.split("+").length) error = "invalidStroke";
  else if (trigger === "L") error = "leftOnlyUnsupported";
  else if (!error && !parsed.steps.length && ["R", "M"].includes(trigger)) error = "singleClickUnsupported";
  return { trigger, steps: parsed.steps, error };
}
