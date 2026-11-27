/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import en from "./locales/en.json";
import zhTW from "./locales/zh-TW.json";
import { DEFAULT_CONFIG } from "../domain/defaults";
import { MOUSE_BUTTONS, TRIGGER_CATEGORIES } from "../domain/triggerTypes";
import { SCREEN_ZONES } from "../domain/triggers/screen";
import { TRIGGER_INPUT_ERRORS } from "../domain/triggers/stroke";
import { ACTION_TYPE_LABEL_KEYS } from "../features/commands/commandPresets";
import { COMMAND_CATEGORIES, SYSTEM_COMMANDS } from "../domain/commandCategories";

const sourceTexts = Object.values(
  import.meta.glob<string>(["../**/*.ts", "../**/*.tsx", "!../**/*.test.ts"], {
    query: "?raw",
    import: "default",
    eager: true,
  }),
);

function flattenKeys(value: unknown, prefix = "", output: string[] = []): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return output;
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === "string") output.push(path);
    else flattenKeys(child, path, output);
  }
  return output;
}

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

  it("covers command type labels and the actual system preset catalog", () => {
    for (const key of Object.values(ACTION_TYPE_LABEL_KEYS)) requireText(locale, key);
    for (const category of COMMAND_CATEGORIES) requireText(locale, `nav.${category}`);
    for (const preset of SYSTEM_COMMANDS) requireText(locale, `dialogs.${preset.label}`);
  });

  it("covers all parser errors and built-in scope titles", () => {
    for (const error of TRIGGER_INPUT_ERRORS) requireText(locale, `gestures.${error}`);
    for (const target of DEFAULT_CONFIG.targets) requireText(locale, `targets.${target.id}Title`);
  });

  it("contains no orphan translation keys outside static and dynamic usages", () => {
    const used = new Set<string>();
    const literalKeyPattern = /(["'`])([a-zA-Z]+\.[a-zA-Z0-9_-]+)\1/g;
    for (const content of sourceTexts) {
      for (const match of content.matchAll(literalKeyPattern)) used.add(match[2]);
    }
    for (const section of ["corners", "edges", "halves"]) used.add(`screenEditor.${section}`);
    for (const category of TRIGGER_CATEGORIES) used.add(`nav.${category}`);
    for (const category of COMMAND_CATEGORIES) used.add(`nav.${category}`);
    for (const trigger of Object.keys(SCREEN_ZONES)) {
      used.add(`screenLabels.${trigger}`);
      used.add(`triggers.${trigger}`);
    }
    for (const trigger of MOUSE_BUTTONS) used.add(`triggers.${trigger}`);
    for (const action of DEFAULT_CONFIG.actionTemplates) used.add(`actionNames.${action.id}`);
    for (const key of Object.values(ACTION_TYPE_LABEL_KEYS)) used.add(key);
    for (const preset of SYSTEM_COMMANDS) used.add(`dialogs.${preset.label}`);
    for (const error of TRIGGER_INPUT_ERRORS) used.add(`gestures.${error}`);
    for (const target of DEFAULT_CONFIG.targets) used.add(`targets.${target.id}Title`);

    const orphans = flattenKeys(locale).filter((key) => !used.has(key));
    expect(orphans).toEqual([]);
  });
});
