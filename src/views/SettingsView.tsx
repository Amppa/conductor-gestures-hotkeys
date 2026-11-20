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
} from "@fluentui/react-components";
import { AppConfig } from "../types";

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
        <Subtitle2>系統與引擎設定 (System &amp; Engine Settings)</Subtitle2>
        <div>
          <Caption1>配置滑鼠手勢閥值、螢幕邊緣滾動與開機常駐選項。</Caption1>
        </div>
      </div>

      {/* Screen edge scrolling */}
      <Card className={styles.card}>
        <div className={styles.row}>
          <div>
            <div style={{ fontWeight: 600 }}>螢幕頂部邊緣滾輪 (Edge Scrolling)</div>
            <Caption1>
              當游標移動到螢幕最上方邊界時滾動滑鼠滾輪，自動調節系統音量。
            </Caption1>
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
          <div style={{ fontWeight: 600 }}>手勢啟動位移閥值 (Distance Threshold)</div>
          <Caption1>
            滑鼠右鍵按下後，需移動超過此像素距離才判定為手勢，避免一般點擊誤觸（目前：{config.engine.thresholdPx} px）。
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
            <div style={{ fontWeight: 600 }}>手勢偵錯日誌模式 (Debug Log Mode)</div>
            <Caption1>
              在 runtime 目錄記錄詳細手勢軌跡、命中的應用程式與動作分派，方便排查問題。
            </Caption1>
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
            <div style={{ fontWeight: 600 }}>開機自動啟動 (Start with Windows)</div>
            <Caption1>登入 Windows 時自動在背景啟動手勢服務並縮小至系統匣。</Caption1>
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
