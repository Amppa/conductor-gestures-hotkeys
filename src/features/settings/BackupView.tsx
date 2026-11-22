import React, { useState, useRef } from "react";
import {
  makeStyles,
  tokens,
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@fluentui/react-components";
import {
  ArrowDownload20Regular,
  ArrowUpload20Regular,
  ArrowReset20Regular,
  CheckmarkCircle16Regular,
  DismissCircle16Regular,
  Warning20Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { AppConfig, BackupData } from "../../domain/types";
import { DEFAULT_CONFIG } from "../../domain/defaults";
import { normalizeTrigger } from "../gestures/gestureSymbols";

const useStyles = makeStyles({
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "100%",
  },
  btnRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  whiteBtn: {
    backgroundColor: "#ffffff",
    color: tokens.colorNeutralForeground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    ":hover": {
      backgroundColor: "#f5f5f5",
      color: tokens.colorNeutralForeground1Hover,
    },
    ":active": {
      backgroundColor: "#ebebeb",
    },
  },
  feedbackRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: tokens.fontSizeBase200,
    marginTop: "4px",
  },
  successMsg: {
    color: tokens.colorPaletteGreenForeground1,
  },
  errorMsg: {
    color: tokens.colorPaletteRedForeground1,
  },
  dialogWarningHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: tokens.colorPaletteYellowForeground1,
  },
});

interface BackupSectionProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
}

function normalizeImportedConfig(rawConfig: AppConfig): AppConfig {
  return {
    ...rawConfig,
    keyRemaps: rawConfig.keyRemaps || [],
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

export const BackupSection: React.FC<BackupSectionProps> = ({
  config,
  onUpdateConfig,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status feedback
  const [feedback, setFeedback] = useState<{ isError: boolean; msg: string } | null>(null);

  // Dialog states
  const [pendingConfig, setPendingConfig] = useState<AppConfig | null>(null);
  const [isImportWarningOpen, setIsImportWarningOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // 1. Export config with native system save dialog
  const handleExport = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    const fileName = `gesture-config-${dateStr}.json`;

    const backupData: BackupData = {
      header: {
        app: "Conductor",
        schemaVersion: 1,
        engineType: "ahk-v2",
        exportedAt: now.toISOString(),
      },
      config,
    };

    const jsonStr = JSON.stringify(backupData, null, 2);

    // 1. Priority: Tauri native system save dialog
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const savedPath = await invoke<string | null>("export_config_dialog", {
        content: jsonStr,
        defaultFileName: fileName,
      });

      if (savedPath) {
        setFeedback({
          isError: false,
          msg: t("backup.exportSuccess", { fileName: savedPath }),
        });
      }
      return;
    } catch {
      // Fallback for browser environment
    }

    // 2. Browser fallback: modern showSaveFilePicker
    if ("showSaveFilePicker" in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "JSON Configuration File",
              accept: { "application/json": [".json"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonStr);
        await writable.close();
        setFeedback({
          isError: false,
          msg: t("backup.exportSuccess", { fileName: handle.name || fileName }),
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") {
          return;
        }
      }
    }

    // 3. Simple fallback: standard download link
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback({
      isError: false,
      msg: t("backup.exportSuccess", { fileName }),
    });
  };

  // 2. Select file for import
  const handleSelectImportFile = () => {
    setFeedback(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const targetConfig: AppConfig = parsed.header && parsed.config ? parsed.config : parsed;

        if (!targetConfig || !Array.isArray(targetConfig.targets)) {
          setFeedback({ isError: true, msg: t("backup.importInvalidFormat") });
          return;
        }

        setPendingConfig(targetConfig);
        setIsImportWarningOpen(true);
      } catch {
        setFeedback({ isError: true, msg: t("backup.importInvalidFormat") });
      }
    };
    reader.readAsText(file);
  };

  // Confirm import
  const handleConfirmImport = () => {
    if (!pendingConfig) return;

    const normalized = normalizeImportedConfig(pendingConfig);
    onUpdateConfig(normalized);

    setIsImportWarningOpen(false);
    setPendingConfig(null);
    setFeedback({ isError: false, msg: t("backup.importSuccess") });
  };

  // 3. Confirm reset
  const handleConfirmReset = () => {
    onUpdateConfig(DEFAULT_CONFIG);
    setIsResetConfirmOpen(false);
    setFeedback({ isError: false, msg: t("backup.resetSuccess") });
  };

  return (
    <div className={styles.controls}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Three clean white buttons */}
      <div className={styles.btnRow}>
        <Button
          size="small"
          className={styles.whiteBtn}
          icon={<ArrowDownload20Regular />}
          onClick={handleExport}
        >
          {t("backup.exportBtn")}
        </Button>

        <Button
          size="small"
          className={styles.whiteBtn}
          icon={<ArrowUpload20Regular />}
          onClick={handleSelectImportFile}
        >
          {t("backup.importBtn")}
        </Button>

        <Button
          size="small"
          className={styles.whiteBtn}
          icon={<ArrowReset20Regular />}
          onClick={() => setIsResetConfirmOpen(true)}
        >
          {t("backup.resetBtn")}
        </Button>
      </div>

      {/* Brief feedback status */}
      {feedback && (
        <div
          className={`${styles.feedbackRow} ${
            feedback.isError ? styles.errorMsg : styles.successMsg
          }`}
        >
          {feedback.isError ? (
            <DismissCircle16Regular />
          ) : (
            <CheckmarkCircle16Regular />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Warning Dialog: Overwrite on Import */}
      <Dialog
        open={isImportWarningOpen}
        onOpenChange={(_, data) => setIsImportWarningOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogWarningHeader}>
                <Warning20Regular />
                <span>{t("backup.importWarningTitle")}</span>
              </div>
            </DialogTitle>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setIsImportWarningOpen(false)}
              >
                {t("backup.cancel")}
              </Button>
              <Button appearance="primary" onClick={handleConfirmImport}>
                {t("backup.confirm")}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Warning Dialog: Restore Factory Defaults */}
      <Dialog
        open={isResetConfirmOpen}
        onOpenChange={(_, data) => setIsResetConfirmOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogWarningHeader}>
                <Warning20Regular />
                <span>{t("backup.resetWarningTitle")}</span>
              </div>
            </DialogTitle>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setIsResetConfirmOpen(false)}
              >
                {t("backup.cancel")}
              </Button>
              <Button appearance="primary" onClick={handleConfirmReset}>
                {t("backup.confirm")}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
