import React, { useState, useEffect, useRef } from "react";
import { makeStyles } from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import { Sidebar, NavTabId } from "./components/Sidebar";
import { Header } from "./components/Header";
import { TargetsView } from "./views/TargetsView";
import { GesturesView } from "./views/GesturesView";
import { ActionsView } from "./views/ActionsView";
import { SettingsView } from "./views/SettingsView";
import { DEFAULT_CONFIG } from "./defaults";
import { AppConfig, Target, Gesture, Action } from "./types";
import { normalizeTrigger } from "./utils/gestureSymbols";

function migrateConfigTriggers(rawConfig: AppConfig): AppConfig {
  return {
    ...rawConfig,
    gestureTemplates: (rawConfig.gestureTemplates || []).map((g) => ({
      ...g,
      trigger: normalizeTrigger(g.trigger) as any,
    })),
    targets: (rawConfig.targets || []).map((t) => ({
      ...t,
      bindings: (t.bindings || []).map((b) => ({
        ...b,
        gesture: {
          ...b.gesture,
          trigger: normalizeTrigger(b.gesture.trigger) as any,
        },
      })),
    })),
  };
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%",
  },
  content: {
    flex: 1,
    overflow: "hidden",
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
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

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
          await invoke<{ success: boolean; msg: string }>("apply_config", {
            config: activeConfig,
          });
        } catch (e) {
          console.warn("Auto-apply engine on startup warning:", e);
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

  const handleTogglePause = async () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("set_engine_paused", { paused: nextPaused });
    } catch {
      // Browser fallback
    }
  };

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
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const res = await invoke<{ success: boolean; msg: string }>("apply_config", { config });
      setSavedConfig(config);
      setFeedbackMsg(res?.msg || t("header.appliedSuccess"));
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = window.setTimeout(() => {
        setFeedbackMsg(null);
      }, 3000);
    } catch (err) {
      alert(t("app.applyFailed", { err }));
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
      gestureTemplates: newGestures,
    }));
  };

  const handleUpdateActions = (newActions: Action[]) => {
    setConfig((prev) => ({
      ...prev,
      actionTemplates: newActions,
    }));
  };

  const getTabTitle = (tab: NavTabId): string => {
    switch (tab) {
      case "targets":
        return t("nav.targets");
      case "gestures":
        return t("nav.gestures");
      case "actions":
        return t("nav.actions");
      case "settings":
        return t("nav.settings");
    }
  };

  return (
    <div className={styles.root}>
      <Sidebar selectedTab={selectedTab} onTabSelect={setSelectedTab} />
      <div className={styles.mainArea}>
        <Header
          title={getTabTitle(selectedTab)}
          isPaused={isPaused}
          isDirty={isDirty}
          feedbackMsg={feedbackMsg}
          onTogglePause={handleTogglePause}
          onReload={handleReload}
        />
        <main className={styles.content}>
          {selectedTab === "targets" && (
            <TargetsView
              targets={config.targets}
              onUpdateTargets={handleUpdateTargets}
            />
          )}
          {selectedTab === "gestures" && (
            <GesturesView
              gestures={config.gestureTemplates}
              onUpdateGestures={handleUpdateGestures}
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
      </div>
    </div>
  );
};
