import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

const repoRoot = process.cwd();
const srcDir = join(repoRoot, "src");
const localeFiles = {
  "zh-TW": join(srcDir, "i18n", "locales", "zh-TW.json"),
  en: join(srcDir, "i18n", "locales", "en.json"),
};
const errors = [];

function flattenLocale(value, path = "", output = new Map()) {
  if (typeof value === "string") {
    output.set(path, value);
    return output;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`Locale value must be a string or object: ${path || "<root>"}`);
    return output;
  }

  for (const [key, child] of Object.entries(value)) {
    flattenLocale(child, path ? `${path}.${key}` : key, output);
  }
  return output;
}

function readLocale(name, filePath) {
  try {
    return flattenLocale(JSON.parse(readFileSync(filePath, "utf8")));
  } catch (error) {
    errors.push(`Unable to read ${name} locale: ${error.message}`);
    return new Map();
  }
}

function interpolationNames(value) {
  return new Set(
    [...value.matchAll(/{{\s*([^},\s]+)[^}]*}}/g)].map((match) => match[1]),
  );
}

function sameSet(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

function sourceFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(fullPath));
    } else if ([".ts", ".tsx"].includes(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const locales = Object.fromEntries(
  Object.entries(localeFiles).map(([name, filePath]) => [name, readLocale(name, filePath)]),
);
const referenceName = "zh-TW";
const reference = locales[referenceName];

for (const [name, locale] of Object.entries(locales)) {
  if (name === referenceName) {
    continue;
  }

  for (const key of reference.keys()) {
    if (!locale.has(key)) {
      errors.push(`${name} is missing translation key: ${key}`);
    }
  }
  for (const key of locale.keys()) {
    if (!reference.has(key)) {
      errors.push(`${name} has an extra translation key: ${key}`);
    }
  }

  for (const [key, referenceValue] of reference.entries()) {
    const translatedValue = locale.get(key);
    if (translatedValue === undefined) {
      continue;
    }
    const expectedNames = interpolationNames(referenceValue);
    const actualNames = interpolationNames(translatedValue);
    if (!sameSet(expectedNames, actualNames)) {
      errors.push(`${name} interpolation parameters differ for key: ${key}`);
    }
  }
}

const staticKeyPattern = /\b(?:t|i18n\.t)\(\s*(["'`])([^"'`$]+)\1\s*(?=[,)])/g;
let staticUsageCount = 0;

for (const filePath of sourceFiles(srcDir)) {
  const source = readFileSync(filePath, "utf8");
  for (const match of source.matchAll(staticKeyPattern)) {
    const key = match[2];
    staticUsageCount += 1;
    for (const [name, locale] of Object.entries(locales)) {
      if (!locale.has(key)) {
        errors.push(`${relative(repoRoot, filePath)} uses missing ${name} key: ${key}`);
      }
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `i18n validation passed: ${reference.size} keys, ${staticUsageCount} static usages`,
);
