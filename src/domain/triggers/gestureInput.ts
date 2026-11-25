import { parseMouseInput } from "./mouse";
import { isScreenInput, parseScreenInput, SCREEN_ZONES } from "./screen";
import { StrokeInput } from "./stroke";

export function parseGestureInput(raw: string, fallback = "R"): StrokeInput {
  return isScreenInput(raw) || fallback in SCREEN_ZONES
    ? parseScreenInput(raw, fallback)
    : parseMouseInput(raw, fallback);
}
