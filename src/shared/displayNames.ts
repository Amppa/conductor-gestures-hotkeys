import type { TFunction } from "i18next";
import { Action } from "../domain/types";

/**
 * Resolves the localized display name of an action, falling back to the
 * user-provided name for custom actions.
 */
export function formatActionName(
  t: TFunction,
  action: Pick<Action, "id" | "name">,
): string {
  return t(`actionNames.${action.id}`, { defaultValue: action.name });
}
