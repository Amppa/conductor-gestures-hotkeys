import React from "react";
import {
  makeStyles,
  tokens,
  Title3,
  Divider,
  Switch,
  Slider,
  Select,
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import { AppConfig, Language } from "../../domain/types";
import { BackupSection } from "./BackupView";

const useStyles = makeStyles({
  container: {
    padding: "16px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minHeight: "100%",
    boxSizing: "border-box",
    justifyContent: "flex-start",
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flexShrink: 0,
  },
  pageTitle: {
    fontSize: "20px",
    lineHeight: "24px",
    fontWeight: tokens.fontWeightSemibold,
    margin: "0 !important",
    padding: 0,
  },
  divider: {
    margin: "0 !important",
  },
  settingsList: {
    width: "100%",
    maxWidth: "680px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "minmax(180px, 220px) minmax(300px, 1fr)",
    columnGap: "24px",
    alignItems: "center",
    justifyContent: "start",
    minHeight: "40px",
    padding: "4px 0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    ":last-child": {
      borderBottom: "none",
    },
  },
  sliderGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "240px",
    minWidth: 0,
  },
  slider: {
    flexGrow: 1,
    minWidth: 0,
  },
  select: {
    width: "200px",
    maxWidth: "100%",
  },
  switch: {
    justifySelf: "start",
  },
  itemLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
  },
  valueLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontVariantNumeric: "tabular-nums",
    width: "40px",
    textAlign: "right",
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
      <div className={styles.pageHeader}>
        <Title3 as="h1" className={styles.pageTitle}>{t("nav.settings")}</Title3>
        <Divider className={styles.divider} />
      </div>
      <div className={styles.settingsList}>
        <div className={styles.row}>
          <span className={styles.itemLabel}>{t("settings.languageTitle")}</span>
          <Select
            className={styles.select}
            aria-label={t("settings.languageTitle")}
            value={config.language}
            onChange={(_, data) => handleLanguageChange(data.value as Language)}
          >
            <option value="zh-TW">繁體中文</option>
            <option value="en">English (US)</option>
          </Select>
        </div>

        <div className={styles.row}>
          <span className={styles.itemLabel}>{t("settings.thresholdTitle")}</span>
          <div className={styles.sliderGroup}>
            <Slider
              className={styles.slider}
              aria-label={t("settings.thresholdTitle")}
              min={5}
              max={30}
              step={5}
              value={config.engine.thresholdPx}
              onChange={(_, data) => handleThresholdChange(data.value)}
            />
            <span className={styles.valueLabel}>{config.engine.thresholdPx} px</span>
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.itemLabel}>{t("settings.debugTitle")}</span>
          <Switch
            className={styles.switch}
            aria-label={t("settings.debugTitle")}
            checked={config.engine.debug}
            onChange={(_, data) => handleDebugLogChange(data.checked)}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.itemLabel}>{t("settings.autostartTitle")}</span>
          <Switch
            className={styles.switch}
            aria-label={t("settings.autostartTitle")}
            checked={autostartEnabled}
            onChange={(_, data) => onToggleAutostart(data.checked)}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.itemLabel}>{t("settings.backupTitle")}</span>
          <BackupSection config={config} onUpdateConfig={onUpdateConfig} />
        </div>
      </div>
    </div>
  );
};
