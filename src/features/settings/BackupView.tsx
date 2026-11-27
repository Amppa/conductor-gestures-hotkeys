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
import { normalizeImportedConfig } from "../../domain/configNormalization";
import { validateImportedConfig } from "../../app/configService";
import { invokeTauri } from "../../shared/tauri";

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

interface SaveFileHandle {
  name: string;
  createWritable(): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }>;
}

type SaveFilePicker = (options: {
  suggestedName: string;
  types: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}) => Promise<SaveFileHandle>;

interface BackupSectionProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
}

export const BackupSection: React.FC<BackupSectionProps> = ({
  config,
  onUpdateConfig,
}) => {
  const styles = useStyles();
  const { t, i18n } = useTranslation();
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
    if ("__TAURI_INTERNALS__" in window) {
      try {
        const savedPath = await invokeTauri<string | null>("export_config_dialog", {
          content: jsonStr,
          defaultFileName: fileName,
        });

        if (savedPath) {
          setFeedback({
            isError: false,
            msg: t("backup.exportSuccess", { fileName: savedPath }),
          });
        }
        // A null path means the native dialog was cancelled.
      } catch (error) {
        setFeedback({
          isError: true,
          msg: typeof error === "string" ? error : String(error),
        });
      }
      return;
    }

    // 2. Browser fallback: modern showSaveFilePicker
    const windowWithPicker = window as Window & {
      showSaveFilePicker?: SaveFilePicker;
    };
    if (windowWithPicker.showSaveFilePicker) {
      try {
        const handle = await windowWithPicker.showSaveFilePicker({
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
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
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

  const reportInvalidImport = (msg?: unknown) => {
    setFeedback({
      isError: true,
      msg: typeof msg === "string" && msg ? msg : t("backup.importInvalidFormat"),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      if (typeof text !== "string") {
        reportInvalidImport();
        return;
      }

      // The host owns schema validation; only the plain-browser dev build falls
      // back to the weaker local shape check.
      if ("__TAURI_INTERNALS__" in window) {
        try {
          setPendingConfig(await validateImportedConfig(text));
          setIsImportWarningOpen(true);
        } catch (error) {
          reportInvalidImport(error);
        }
        return;
      }

      try {
        const parsed = JSON.parse(text);
        const targetConfig: AppConfig = parsed.header && parsed.config ? parsed.config : parsed;

        if (!targetConfig || !Array.isArray(targetConfig.targets)) {
          reportInvalidImport();
          return;
        }

        setPendingConfig(targetConfig);
        setIsImportWarningOpen(true);
      } catch {
        reportInvalidImport();
      }
    };
    reader.onerror = () => reportInvalidImport();
    reader.readAsText(file);
  };

  // Confirm import
  const handleConfirmImport = () => {
    if (!pendingConfig) return;

    const normalized = normalizeImportedConfig(pendingConfig);
    onUpdateConfig(normalized);
    if (normalized.language) {
      i18n.changeLanguage(normalized.language);
    }

    setIsImportWarningOpen(false);
    setPendingConfig(null);
    setFeedback({ isError: false, msg: t("backup.importSuccess") });
  };

  // 3. Confirm reset
  const handleConfirmReset = () => {
    onUpdateConfig(DEFAULT_CONFIG);
    i18n.changeLanguage(DEFAULT_CONFIG.language);
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
