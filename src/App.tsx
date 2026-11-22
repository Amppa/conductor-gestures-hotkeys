import React, { useState, useEffect } from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import { Sidebar, NavTabId } from "./components/Sidebar";
import { ApplyBar } from "./components/ApplyBar";
import { TargetsView } from "./views/TargetsView";
import { ExcludedView } from "./views/ExcludedView";
import { GesturesView } from "./views/GesturesView";
import { HotkeysView } from "./views/HotkeysView";
import { ActionsView } from "./views/ActionsView";
import { SettingsView } from "./views/SettingsView";
import { DEFAULT_CONFIG } from "./defaults";
import { AppConfig, Target, Gesture, Action } from "./types";
import { normalizeTrigger } from "./utils/gestureSymbols";
import { isKeyboardTemplate } from "./utils/triggerTypes";

function migrateConfigTriggers(rawConfig: AppConfig): AppConfig {
  // 1. Auto-merge missing action templates from defaults
  const existingActionIds = new Set((rawConfig.actionTemplates || []).map((a) => a.id));
  const mergedActions = [...(rawConfig.actionTemplates || [])];
  for (const defA of DEFAULT_CONFIG.actionTemplates) {
    if (!existingActionIds.has(defA.id)) {
      mergedActions.push(defA);
    }
  }

  // 2. Templates are user-owned; deleted factory templates must not reappear.
  const gestureTemplates = rawConfig.gestureTemplates || [];

  // 3. Auto-merge missing factory bindings into Global Target
  const defGlobal = DEFAULT_CONFIG.targets.find((dt) => dt.kind === "global");
  const updatedTargets = (rawConfig.targets || []).map((t) => {
    if (t.kind === "global" && defGlobal) {
      const existingBindingIds = new Set(t.bindings.map((b) => b.id));
      const newBindings = [...t.bindings];
      for (const defB of defGlobal.bindings) {
        if (!existingBindingIds.has(defB.id)) {
          newBindings.push(defB);
        }
      }
      return {
        ...t,
        bindings: newBindings.map((b) => ({
          ...b,
          gesture: {
            ...b.gesture,
            trigger: normalizeTrigger(b.gesture.trigger) as any,
          },
        })),
      };
    }
    return {
      ...t,
      bindings: (t.bindings || []).map((b) => ({
        ...b,
        gesture: {
          ...b.gesture,
          trigger: normalizeTrigger(b.gesture.trigger) as any,
        },
      })),
    };
  });

  return {
    ...rawConfig,
    actionTemplates: mergedActions,
    gestureTemplates: gestureTemplates.map((g) => ({
      ...g,
      trigger: normalizeTrigger(g.trigger) as any,
      steps: [...(g.steps || [])],
    })),
    targets: updatedTargets,
  };
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    overflowX: "hidden",
    overflowY: "auto",
  },
});

export const App: React.FC = () => {
  const styles = useStyles();
  const { t, i18n } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<NavTabId>("targets");
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [savedConfig, setSavedConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isPaused, setIsPaused] = useState(false);
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  // Load config and sync runtime state on startup
  useEffect(() => {
    const initApp = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const rawLoaded = await invoke<AppConfig>("load_config");
        const loaded = rawLoaded ? migrateConfigTriggers(rawLoaded) : null;
        const activeConfig = loaded || config;
        if (loaded) {
          setConfig(loaded);
          setSavedConfig(loaded);
          if (loaded.language) {
            i18n.changeLanguage(loaded.language);
          }
        }
        // Auto-apply gesture engine on startup to guarantee active status
        try {
          const res = await invoke<{ success: boolean; msg: string }>("apply_config", {
            config: activeConfig,
          });
          if (res && !res.success) {
            setApplyError(res.msg || t("app.applyFailed", { err: "Engine failed to start" }));
          }
        } catch (e) {
          console.warn("Auto-apply engine on startup warning:", e);
          const errorText = e instanceof Error ? e.message : String(e);
          setApplyError(t("app.applyFailed", { err: errorText }));
        }
        const autostart = await invoke<boolean>("autostart_enabled");
        setAutostartEnabled(autostart);
        const paused = await invoke<boolean>("is_engine_paused");
        setIsPaused(paused);
      } catch {
        // Fallback in browser dev mode
      }
    };
    initApp();
  }, []);

  const handleToggleAutostart = async (enabled: boolean) => {
    setAutostartEnabled(enabled);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("set_autostart", { enabled });
    } catch {
      // Browser fallback
    }
  };

  const handleReload = async () => {
    setIsApplying(true);
    setApplyError(null);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const res = await invoke<{ success: boolean; msg: string }>("apply_config", { config });
      if (res && !res.success) {
        setApplyError(res.msg || t("app.applyFailed", { err: "Engine failed to reload" }));
      } else {
        setSavedConfig(config);
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : String(err);
      setApplyError(t("app.applyFailed", { err: errorText }));
    } finally {
      setIsApplying(false);
    }
  };

  const handleDiscardChanges = () => {
    setConfig(savedConfig);
    setApplyError(null);
    if (savedConfig.language) {
      i18n.changeLanguage(savedConfig.language);
    }
  };

  const handleUpdateTargets = (newTargets: Target[]) => {
    setConfig((prev) => ({
      ...prev,
      targets: newTargets,
    }));
  };

  const handleUpdateGestures = (newGestures: Gesture[]) => {
    setConfig((prev) => ({
      ...prev,
      gestureTemplates: [
        ...newGestures,
        ...prev.gestureTemplates.filter(isKeyboardTemplate),
      ],
    }));
  };

  const handleUpdateHotkeys = (newHotkeys: Gesture[]) => {
    setConfig((prev) => ({
      ...prev,
      gestureTemplates: [
        ...prev.gestureTemplates.filter((template) => !isKeyboardTemplate(template)),
        ...newHotkeys,
      ],
    }));
  };

  const handleAddGestureTemplate = (newTemplate: Gesture) => {
    setConfig((prev) => ({
      ...prev,
      gestureTemplates: [...prev.gestureTemplates, newTemplate],
    }));
  };

  const handleAddActionTemplate = (newAction: Action) => {
    setConfig((prev) => ({
      ...prev,
      actionTemplates: [...prev.actionTemplates, newAction],
    }));
  };

  const handleUpdateActions = (newActions: Action[]) => {
    setConfig((prev) => ({
      ...prev,
      actionTemplates: newActions,
    }));
  };

  return (
    <div className={styles.root}>
      <Sidebar selectedTab={selectedTab} onTabSelect={setSelectedTab} />
      <div className={styles.mainArea}>
        <main className={styles.content}>
          {selectedTab === "targets" && (
            <TargetsView
              targets={config.targets}
              gestureTemplates={config.gestureTemplates}
              actionTemplates={config.actionTemplates}
              onUpdateTargets={handleUpdateTargets}
              onAddGestureTemplate={handleAddGestureTemplate}
              onAddActionTemplate={handleAddActionTemplate}
            />
          )}
          {selectedTab === "excluded" && (
            <ExcludedView
              targets={config.targets}
              onUpdateTargets={handleUpdateTargets}
            />
          )}
          {selectedTab === "gestures" && (
            <GesturesView
              gestures={config.gestureTemplates.filter(
                (template) => !isKeyboardTemplate(template)
              )}
              onUpdateGestures={handleUpdateGestures}
            />
          )}
          {selectedTab === "hotkeys" && (
            <HotkeysView
              hotkeys={config.gestureTemplates.filter(isKeyboardTemplate)}
              onUpdateHotkeys={handleUpdateHotkeys}
            />
          )}
          {selectedTab === "actions" && (
            <ActionsView
              actions={config.actionTemplates}
              onUpdateActions={handleUpdateActions}
            />
          )}
          {selectedTab === "settings" && (
            <SettingsView
              config={config}
              autostartEnabled={autostartEnabled}
              onUpdateConfig={setConfig}
              onToggleAutostart={handleToggleAutostart}
            />
          )}
        </main>
        <ApplyBar
          isDirty={isDirty}
          isApplying={isApplying}
          errorMsg={applyError}
          onDiscard={handleDiscardChanges}
          onApply={handleReload}
        />
      </div>
    </div>
  );
};
