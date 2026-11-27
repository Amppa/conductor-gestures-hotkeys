import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./defaults";
import { migrateConfig, normalizeImportedConfig } from "./configNormalization";
import { AppConfig } from "./types";

function withoutActionTemplate(id: string): AppConfig {
  return {
    ...DEFAULT_CONFIG,
    actionTemplates: DEFAULT_CONFIG.actionTemplates.filter(
      (action) => action.id !== id,
    ),
  };
}

function globalTarget(config: AppConfig) {
  return config.targets.find((target) => target.kind === "global")!;
}

describe("migrateConfig", () => {
  it("restores missing factory action templates", () => {
    const migrated = migrateConfig(withoutActionTemplate("act-back"));

    expect(migrated.actionTemplates.map((action) => action.id)).toContain("act-back");
  });

  it("restores missing factory bindings on the global scope only", () => {
    const base = withoutActionTemplate("act-back");
    const trimmed: AppConfig = {
      ...base,
      targets: base.targets.map((target) =>
        target.kind === "global"
          ? {
              ...target,
              bindings: target.bindings.filter((binding) => binding.id === "g-back"),
            }
          : target,
      ),
    };

    const migrated = migrateConfig(trimmed);
    const factoryGlobal = DEFAULT_CONFIG.targets.find(
      (target) => target.kind === "global",
    )!;

    expect(globalTarget(migrated).bindings).toHaveLength(
      factoryGlobal.bindings.length,
    );
  });

  it("does not resurrect user-deleted gesture templates", () => {
    const migrated = migrateConfig({ ...DEFAULT_CONFIG, gestureTemplates: [] });

    expect(migrated.gestureTemplates).toEqual([]);
  });

  it("normalizes legacy trigger aliases on templates and rules", () => {
    const legacy: AppConfig = {
      ...DEFAULT_CONFIG,
      gestureTemplates: [
        { id: "legacy", name: "Legacy", trigger: "RB", steps: ["U"] },
      ],
      targets: DEFAULT_CONFIG.targets.map((target) =>
        target.kind === "global"
          ? {
              ...target,
              bindings: [
                {
                  ...target.bindings[0],
                  gesture: { ...target.bindings[0].gesture, trigger: "X1B" },
                },
              ],
            }
          : target,
      ),
    };

    const migrated = migrateConfig(legacy);

    expect(migrated.gestureTemplates[0].trigger).toBe("R");
    expect(globalTarget(migrated).bindings[0].gesture.trigger).toBe("X1");
    expect(legacy.gestureTemplates[0].trigger).toBe("RB");
  });

  it("normalizes legacy engine OSD settings on startup", () => {
    const legacy = {
      ...DEFAULT_CONFIG,
      engine: {
        ...DEFAULT_CONFIG.engine,
        osdDurationMs: 300,
        osdFontSizePx: undefined,
        osdFontSizePt: 24,
        osdOpacityPct: 51,
      },
    } as unknown as AppConfig;

    const migrated = migrateConfig(legacy);
    expect(migrated.engine.osdDurationMs).toBe(500);
    expect(migrated.engine.osdFontSizePx).toBe(25);
    expect(migrated.engine.osdOpacityPct).toBe(50);
  });
});

describe("normalizeImportedConfig", () => {
  it("accepts the legacy osdFontSizePt field", () => {
    const legacy = {
      ...DEFAULT_CONFIG,
      engine: {
        ...DEFAULT_CONFIG.engine,
        osdFontSizePx: undefined,
        osdFontSizePt: 24,
      },
    } as unknown as AppConfig;

    expect(normalizeImportedConfig(legacy).engine.osdFontSizePx).toBe(25);
  });

  it("clamps and rounds OSD settings to supported values", () => {
    const normalized = normalizeImportedConfig({
      ...DEFAULT_CONFIG,
      engine: {
        ...DEFAULT_CONFIG.engine,
        osdDurationMs: 300,
        osdOpacityPct: 51,
      },
    });

    expect(normalized.engine.osdDurationMs).toBe(500);
    expect(normalized.engine.osdOpacityPct).toBe(50);
  });

  it("fills missing key remaps with an empty list", () => {
    const { keyRemaps: _ignored, ...withoutKeyRemaps } = DEFAULT_CONFIG;

    expect(normalizeImportedConfig(withoutKeyRemaps as AppConfig).keyRemaps).toEqual([]);
  });
});
