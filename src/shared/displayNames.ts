import type { TFunction } from "i18next";
import { Action, Target } from "../domain/types";

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

/**
 * Resolves the localized display name of a scope, preserving custom names
 * after the user renames a factory group.
 */
export function formatScopeName(
  t: TFunction,
  target: Pick<Target, "id" | "name" | "kind">,
): string {
  if (target.kind === "global") {
    return t("targets.globalTitle", { defaultValue: target.name });
  }
  if (target.name !== "Browsers" && target.name !== "Group 01") {
    return target.name;
  }
  return t(`targets.${target.id}Title`, { defaultValue: target.name });
}
