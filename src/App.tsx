import React, { useState, useEffect } from "react";
import { makeStyles } from "@fluentui/react-components";
import { Sidebar, NavTabId } from "./components/Sidebar";
import { Header } from "./components/Header";
import { TargetsView } from "./views/TargetsView";
import { GesturesView } from "./views/GesturesView";
import { ActionsView } from "./views/ActionsView";
import { SettingsView } from "./views/SettingsView";
import { DEFAULT_CONFIG } from "./defaults";
import { AppConfig, Target, Gesture } from "./types";

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
  const [selectedTab, setSelectedTab] = useState<NavTabId>("targets");
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isPaused, setIsPaused] = useState(false);
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [statusMsg, setStatusMsg] = useState("手勢引擎運作中");

  // Load config and sync runtime state on startup
  useEffect(() => {
    const initApp = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const loaded = await invoke<AppConfig>("load_config");
        const activeConfig = loaded || config;
        if (loaded) {
          setConfig(loaded);
        }
        // Auto-apply gesture engine on startup to guarantee active status
        try {
          const res = await invoke<{ success: boolean; msg: string }>("apply_config", {
            config: activeConfig,
          });
          if (res?.msg) {
            setStatusMsg(res.msg);
          }
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
      setStatusMsg(res.msg);
    } catch (err) {
      alert(`套用失敗: ${err}`);
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

  const getTabTitle = (tab: NavTabId): string => {
    switch (tab) {
      case "targets":
        return "目標清單 (Targets)";
      case "gestures":
        return "手勢清單 (Gestures)";
      case "actions":
        return "動作清單 (Actions)";
      case "settings":
        return "系統設定 (Settings)";
    }
  };

  return (
    <div className={styles.root}>
      <Sidebar selectedTab={selectedTab} onTabSelect={setSelectedTab} />
      <div className={styles.mainArea}>
        <Header
          title={getTabTitle(selectedTab)}
          isPaused={isPaused}
          statusMsg={statusMsg}
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
            <ActionsView actions={config.actionTemplates} />
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
