import { describe, expect, it } from "vitest";
import en from "./locales/en.json";
import zhTW from "./locales/zh-TW.json";
import { DEFAULT_CONFIG } from "../domain/defaults";
import { MOUSE_BUTTONS, TRIGGER_CATEGORIES } from "../domain/triggerTypes";
import { SCREEN_ZONES } from "../domain/triggers/screen";
import { TRIGGER_INPUT_ERRORS } from "../domain/triggers/stroke";
import { COMMON_HOTKEYS, ACTION_TYPE_LABEL_KEYS } from "../features/commands/commandPresets";

function requireText(locale: object, path: string): void {
  let value: unknown = locale;
  for (const part of path.split(".")) {
    value = value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined;
  }
  expect(typeof value, `Missing translation: ${path}`).toBe("string");
  expect((value as string).trim(), `Empty translation: ${path}`).not.toBe("");
}

describe.each(Object.entries({ en, "zh-TW": zhTW }))("dynamic i18n contracts: %s", (_, locale) => {
  it("covers the actual screen catalog and all mouse buttons", () => {
    for (const category of TRIGGER_CATEGORIES) requireText(locale, `nav.${category}`);
    expect(Object.keys(locale.screenLabels).sort()).toEqual(Object.keys(SCREEN_ZONES).sort());
    for (const trigger of Object.keys(SCREEN_ZONES)) {
      requireText(locale, `screenLabels.${trigger}`);
      requireText(locale, `triggers.${trigger}`);
    }
    for (const trigger of MOUSE_BUTTONS) requireText(locale, `triggers.${trigger}`);
  });

  it("covers every built-in command without requiring translations for user commands", () => {
    expect(Object.keys(locale.actionNames).sort()).toEqual(DEFAULT_CONFIG.actionTemplates.map((action) => action.id).sort());
    for (const action of DEFAULT_CONFIG.actionTemplates) requireText(locale, `actionNames.${action.id}`);
  });

  it("covers command type labels and the actual common preset catalog", () => {
    for (const key of Object.values(ACTION_TYPE_LABEL_KEYS)) requireText(locale, key);
    for (const preset of COMMON_HOTKEYS) requireText(locale, `dialogs.${preset.key}`);
  });

  it("covers all parser errors and built-in scope titles", () => {
    for (const error of TRIGGER_INPUT_ERRORS) requireText(locale, `gestures.${error}`);
    for (const target of DEFAULT_CONFIG.targets) requireText(locale, `targets.${target.id}Title`);
  });
});
