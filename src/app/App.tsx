import React, { useCallback, useEffect, useRef, useState } from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import { Sidebar, NavTabId } from "./Sidebar";
import { ApplyBar } from "./ApplyBar";
import { ScopesView } from "../features/scopes/ScopesView";
import { ExcludedView } from "../features/scopes/ExcludedView";
import { GesturesView } from "../features/gestures/GesturesView";
import { HotkeysView } from "../features/hotkeys/HotkeysView";
import { CommandsView } from "../features/commands/CommandsView";
import { SettingsView } from "../features/settings/SettingsView";
import { DEFAULT_CONFIG } from "../domain/defaults";
import { AppConfig, Target, Gesture, Action } from "../domain/types";
import { isKeyboardTemplate, isScreenTemplate, getTriggerCategory } from "../domain/triggerTypes";
import { migrateConfig } from "../domain/configNormalization";
import {
  applyConfig,
  loadConfig,
  readAutostartEnabled,
  writeAutostartEnabled,
} from "./configService";

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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const App: React.FC = () => {
  const styles = useStyles();
  const { t, i18n } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<NavTabId>("targets");
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [savedConfig, setSavedConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  const configRef = useRef(config);
  const applySeqRef = useRef(0);
  const initStartedRef = useRef(false);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const runApply = useCallback(async (target: AppConfig) => {
    const applyId = ++applySeqRef.current;
    setIsApplying(true);
    setApplyError(null);
    try {
      const result = await applyConfig(target);
      if (applyId !== applySeqRef.current) {
        return;
      }
      if (!result.success) {
        setApplyError(
          result.msg || t("app.applyFailed", { err: "Engine failed to apply" }),
        );
      } else {
        setSavedConfig(target);
      }
    } catch (error) {
      if (applyId !== applySeqRef.current) {
        return;
      }
      setApplyError(t("app.applyFailed", { err: errorMessage(error) }));
    } finally {
      if (applyId === applySeqRef.current) {
        setIsApplying(false);
      }
    }
  }, [t]);

  useEffect(() => {
    const initApp = async () => {
      if (initStartedRef.current) {
        return;
      }
      initStartedRef.current = true;

      const loaded = await loadConfig();
      if (!loaded) {
        return;
      }

      const activeConfig = migrateConfig(loaded);
      setConfig(activeConfig);
      setSavedConfig(activeConfig);
      if (activeConfig.language) {
        i18n.changeLanguage(activeConfig.language);
      }

      await runApply(activeConfig);

      const autostart = await readAutostartEnabled();
      if (autostart !== null) {
        setAutostartEnabled(autostart);
      }
    };

    void initApp();
  }, [i18n, runApply]);

  const handleToggleAutostart = async (enabled: boolean) => {
    setAutostartEnabled(enabled);
    await writeAutostartEnabled(enabled);
  };

  const handleReload = () => {
    void runApply(configRef.current);
  };

  const handleDiscardChanges = () => {
    setConfig(savedConfig);
    setApplyError(null);
    if (savedConfig.language) {
      i18n.changeLanguage(savedConfig.language);
    }
  };

  const handleUpdateTargets = (targets: Target[]) => {
    setConfig((previous) => ({ ...previous, targets }));
  };

  const handleUpdateGestures = (gestures: Gesture[]) => {
    setConfig((previous) => ({
      ...previous,
      gestureTemplates: [
        ...gestures,
        ...previous.gestureTemplates.filter(
          (template) => getTriggerCategory(template) !== "gestures",
        ),
      ],
    }));
  };

  const handleUpdateScreenTemplates = (templates: Gesture[]) => {
    setConfig((previous) => ({
      ...previous,
      gestureTemplates: [
        ...previous.gestureTemplates.filter(
          (template) => !isScreenTemplate(template),
        ),
        ...templates,
      ],
    }));
  };

  const handleUpdateMouseButtons = (templates: Gesture[]) => {
    setConfig((previous) => ({ ...previous, gestureTemplates: [
      ...previous.gestureTemplates.filter((template) => getTriggerCategory(template) !== "mouseButtons"),
      ...templates,
    ] }));
  };

  const handleUpdateHotkeys = (hotkeys: Gesture[]) => {
    setConfig((previous) => ({
      ...previous,
      gestureTemplates: [
        ...previous.gestureTemplates.filter(
          (template) => !isKeyboardTemplate(template),
        ),
        ...hotkeys,
      ],
    }));
  };

  const handleAddGestureTemplate = (template: Gesture) => {
    setConfig((previous) => {
      const duplicate = previous.gestureTemplates.some(
        (existing) =>
          existing.trigger === template.trigger &&
          existing.steps.join(",") === template.steps.join(","),
      );
      return duplicate
        ? previous
        : { ...previous, gestureTemplates: [...previous.gestureTemplates, template] };
    });
  };

  const handleUpdateActions = (actions: Action[]) => {
    setConfig((previous) => ({ ...previous, actionTemplates: actions }));
  };

  return (
    <div className={styles.root}>
      <Sidebar selectedTab={selectedTab} onTabSelect={setSelectedTab} />
      <div className={styles.mainArea}>
        <main className={styles.content}>
          {selectedTab === "targets" && (
            <ScopesView
              targets={config.targets}
              gestureTemplates={config.gestureTemplates}
              actionTemplates={config.actionTemplates}
              onUpdateTargets={handleUpdateTargets}
              onAddGestureTemplate={handleAddGestureTemplate}
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
                (template) => getTriggerCategory(template) === "gestures",
              )}
              onUpdateGestures={handleUpdateGestures}
            />
          )}
          {selectedTab === "mouseButtons" && (
            <GesturesView
              buttonMode
              gestures={config.gestureTemplates.filter((template) => getTriggerCategory(template) === "mouseButtons")}
              onUpdateGestures={handleUpdateMouseButtons}
            />
          )}
          {selectedTab === "screen" && (
            <GesturesView
              screenMode
              gestures={config.gestureTemplates.filter(isScreenTemplate)}
              onUpdateGestures={handleUpdateScreenTemplates}
            />
          )}
          {selectedTab === "hotkeys" && (
            <HotkeysView
              hotkeys={config.gestureTemplates.filter(isKeyboardTemplate)}
              onUpdateHotkeys={handleUpdateHotkeys}
            />
          )}
          {selectedTab === "actions" && (
            <CommandsView
              actions={config.actionTemplates}
              onUpdateActions={handleUpdateActions}
            />
          )}
          {selectedTab === "popup-menu" && (
            <div style={{ padding: "16px 24px" }}>{t("common.inDevelopment")}</div>
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
