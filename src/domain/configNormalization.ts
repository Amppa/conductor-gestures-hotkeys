import {
  DEFAULT_CONFIG,
  normalizeOsdDurationMs,
  normalizeOsdFontSizePx,
  normalizeOsdOpacityPct,
} from "./defaults";
import { AppConfig, EngineConfig } from "./types";
import { normalizeConfigTriggers } from "./triggerNormalization";
import { isMouseTrigger, mouseTriggerKind } from "./triggerTypes";

export function removeUnsupportedMouseTriggers(config: AppConfig): AppConfig {
  const supported = (gesture: AppConfig["gestureTemplates"][number]) => !isMouseTrigger(gesture.trigger) || mouseTriggerKind(gesture) !== null;
  return { ...config,
    gestureTemplates: config.gestureTemplates.filter(supported),
    targets: config.targets.map((target) => ({ ...target, bindings: target.bindings.filter((binding) => supported(binding.gesture)) })),
  };
}

type LegacyEngineConfig = Partial<EngineConfig> & { osdFontSizePt?: number };

function mergeActionTemplates(config: AppConfig): AppConfig {
  const existingIds = new Set(
    (config.actionTemplates ?? []).map((action) => action.id),
  );
  const missingDefaults = DEFAULT_CONFIG.actionTemplates.filter(
    (action) => !existingIds.has(action.id),
  );

  return {
    ...config,
    actionTemplates: [...(config.actionTemplates ?? []), ...missingDefaults],
  };
}

/**
 * Factory rules live on the global scope only. Templates stay user-owned, so
 * deleted factory templates must never be recreated here.
 */
function mergeFactoryGlobalBindings(config: AppConfig): AppConfig {
  const factoryGlobal = DEFAULT_CONFIG.targets.find(
    (target) => target.kind === "global",
  );
  if (!factoryGlobal) {
    return config;
  }

  return {
    ...config,
    targets: (config.targets ?? []).map((target) => {
      if (target.kind !== "global") {
        return target;
      }
      const existingIds = new Set(target.bindings.map((binding) => binding.id));
      const missingBindings = factoryGlobal.bindings.filter(
        (binding) => !existingIds.has(binding.id),
      );
      return {
        ...target,
        bindings: [...target.bindings, ...missingBindings],
      };
    }),
  };
}

/**
 * Migration used when loading a persisted configuration at startup.
 */
export function migrateConfig(rawConfig: AppConfig): AppConfig {
  return removeUnsupportedMouseTriggers(normalizeConfigTriggers(
    mergeFactoryGlobalBindings(mergeActionTemplates(rawConfig)),
  ));
}

function normalizeEngine(engine?: LegacyEngineConfig): EngineConfig {
  return {
    ...engine,
    enabled: engine?.enabled ?? DEFAULT_CONFIG.engine.enabled,
    debug: engine?.debug ?? DEFAULT_CONFIG.engine.debug,
    thresholdPx: engine?.thresholdPx ?? DEFAULT_CONFIG.engine.thresholdPx,
    osdDurationMs: normalizeOsdDurationMs(
      engine?.osdDurationMs ?? DEFAULT_CONFIG.engine.osdDurationMs,
    ),
    osdFontSizePx: normalizeOsdFontSizePx(
      engine?.osdFontSizePx ??
        engine?.osdFontSizePt ??
        DEFAULT_CONFIG.engine.osdFontSizePx,
    ),
    osdOpacityPct: normalizeOsdOpacityPct(
      engine?.osdOpacityPct ?? DEFAULT_CONFIG.engine.osdOpacityPct,
    ),
  };
}

/**
 * Normalization used for backups created by older builds.
 */
export function normalizeImportedConfig(rawConfig: AppConfig): AppConfig {
  return removeUnsupportedMouseTriggers(normalizeConfigTriggers({
    ...rawConfig,
    engine: normalizeEngine(rawConfig.engine as LegacyEngineConfig | undefined),
    keyRemaps: rawConfig.keyRemaps ?? [],
  }));
}
