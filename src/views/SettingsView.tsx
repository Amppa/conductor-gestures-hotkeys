import React from "react";
import {
  makeStyles,
  tokens,
  Card,
  Subtitle2,
  Caption1,
  Switch,
  Slider,
  Divider,
  Select,
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import { AppConfig, Language } from "../types";

const useStyles = makeStyles({
  container: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    overflowY: "auto",
    height: "calc(100% - 48px)",
  },
  card: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

interface SettingsViewProps {
  config: AppConfig;
  autostartEnabled: boolean;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onToggleAutostart: (enabled: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  autostartEnabled,
  onUpdateConfig,
  onToggleAutostart,
}) => {
  const styles = useStyles();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
    onUpdateConfig({
      ...config,
      language: lang,
    });
  };

  const handleEdgeScrollChange = (enabled: boolean) => {
    onUpdateConfig({
      ...config,
      edgeScroll: {
        ...config.edgeScroll,
        enabled,
      },
    });
  };

  const handleThresholdChange = (val: number) => {
    onUpdateConfig({
      ...config,
      engine: {
        ...config.engine,
        thresholdPx: val,
      },
    });
  };

  const handleDebugLogChange = (enabled: boolean) => {
    onUpdateConfig({
      ...config,
      engine: {
        ...config.engine,
        debug: enabled,
      },
    });
  };

  return (
    <div className={styles.container}>
      <div>
        <Subtitle2>{t("settings.title")}</Subtitle2>
        <div>
          <Caption1>{t("settings.subtitle")}</Caption1>
        </div>
      </div>

      {/* Language Selector */}
      <Card className={styles.card}>
        <div className={styles.row}>
          <div>
            <div style={{ fontWeight: 600 }}>{t("settings.languageTitle")}</div>
            <Caption1>{t("settings.languageDesc")}</Caption1>
          </div>
          <Select
            value={config.language}
            onChange={(_, data) => handleLanguageChange(data.value as Language)}
            style={{ minWidth: "160px" }}
          >
            <option value="zh-TW">繁體中文 (Traditional Chinese)</option>
            <option value="en">English (US)</option>
          </Select>
        </div>
      </Card>

      {/* Screen edge scrolling */}
      <Card className={styles.card}>
        <div className={styles.row}>
          <div>
            <div style={{ fontWeight: 600 }}>{t("settings.edgeScrollTitle")}</div>
            <Caption1>{t("settings.edgeScrollDesc")}</Caption1>
          </div>
          <Switch
            checked={config.edgeScroll.enabled}
            onChange={(_, data) => handleEdgeScrollChange(data.checked)}
          />
        </div>
      </Card>

      {/* Gesture distance threshold */}
      <Card className={styles.card}>
        <div>
          <div style={{ fontWeight: 600 }}>{t("settings.thresholdTitle")}</div>
          <Caption1>
            {t("settings.thresholdDesc")} ({config.engine.thresholdPx} px)
          </Caption1>
        </div>
        <Slider
          min={5}
          max={30}
          step={1}
          value={config.engine.thresholdPx}
          onChange={(_, data) => handleThresholdChange(data.value)}
        />
      </Card>

      {/* Debug Log Mode */}
      <Card className={styles.card}>
        <div className={styles.row}>
          <div>
            <div style={{ fontWeight: 600 }}>{t("settings.debugTitle")}</div>
            <Caption1>{t("settings.debugDesc")}</Caption1>
          </div>
          <Switch
            checked={config.engine.debug}
            onChange={(_, data) => handleDebugLogChange(data.checked)}
          />
        </div>
      </Card>

      <Divider />

      {/* Auto-start on boot */}
      <Card className={styles.card}>
        <div className={styles.row}>
          <div>
            <div style={{ fontWeight: 600 }}>{t("settings.autostartTitle")}</div>
            <Caption1>{t("settings.autostartDesc")}</Caption1>
          </div>
          <Switch
            checked={autostartEnabled}
            onChange={(_, data) => onToggleAutostart(data.checked)}
          />
        </div>
      </Card>
    </div>
  );
};
