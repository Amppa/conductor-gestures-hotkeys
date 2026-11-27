import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Subtitle2,
  Caption1,
  makeStyles,
  tokens,
  Badge,
} from "@fluentui/react-components";
import { Search16Regular, Add16Regular } from "@fluentui/react-icons";
import { invokeTauri } from "../../shared/tauri";

const useStyles = makeStyles({
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  manualRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  procList: {
    maxHeight: "220px",
    overflowY: "auto",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  procItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 10px",
    borderRadius: tokens.borderRadiusSmall,
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
});

interface ProcessItem {
  name: string;
  exe: string;
}

interface AddProcessDialogProps {
  open: boolean;
  targetName: string;
  onAdd: (exe: string) => void;
  onCancel: () => void;
}

const COMMON_PRESET_EXES = [
  "chrome.exe",
  "msedge.exe",
  "firefox.exe",
  "code.exe",
  "devenv.exe",
  "explorer.exe",
  "notepad.exe",
  "photoshop.exe",
  "acad.exe",
  "steam.exe",
  "discord.exe",
];

export const AddProcessDialog: React.FC<AddProcessDialogProps> = ({
  open,
  targetName,
  onAdd,
  onCancel,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [manualInput, setManualInput] = useState("");
  const [filterText, setFilterText] = useState("");
  const [runningProcesses, setRunningProcesses] = useState<ProcessItem[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setManualInput("");
    setFilterText("");
    const fetchProcesses = async () => {
      try {
        const procs = await invokeTauri<ProcessItem[]>("get_running_processes");
        if (!cancelled && procs && procs.length > 0) {
          setRunningProcesses(procs);
          return;
        }
      } catch {
        // Fallback for browser testing
      }
      if (!cancelled) {
        setRunningProcesses(COMMON_PRESET_EXES.map((exe) => ({ name: exe, exe })));
      }
    };
    void fetchProcesses();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleManualAdd = () => {
    let clean = manualInput.trim();
    if (!clean) return;
    if (!clean.toLowerCase().endsWith(".exe")) {
      clean += ".exe";
    }
    onAdd(clean);
    setManualInput("");
  };

  const handleSelectExe = (exe: string) => {
    onAdd(exe);
  };

  const filtered = runningProcesses.filter((p) =>
    p.exe.toLowerCase().includes(filterText.toLowerCase().trim())
  );

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onCancel()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{t("dialogs.addProcess")}：{targetName}</DialogTitle>
          <DialogContent className={styles.content}>
            {/* Manual input */}
            <div className={styles.section}>
              <Subtitle2>{t("dialogs.manualTitle")}</Subtitle2>
              <div className={styles.manualRow}>
                <Input
                  style={{ flex: 1 }}
                  value={manualInput}
                  onChange={(_, data) => setManualInput(data.value)}
                  placeholder={t("dialogs.manualPlaceholder")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleManualAdd();
                    }
                  }}
                />
                <Button appearance="primary" icon={<Add16Regular />} onClick={handleManualAdd}>
                  {t("dialogs.add")}
                </Button>
              </div>
            </div>

            {/* Running processes quick picker */}
            <div className={styles.section}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Subtitle2>{t("dialogs.pickerTitle")}</Subtitle2>
                <Caption1>{t("dialogs.procCount", { count: filtered.length })}</Caption1>
              </div>
              <Input
                contentBefore={<Search16Regular />}
                value={filterText}
                onChange={(_, data) => setFilterText(data.value)}
                placeholder={t("dialogs.searchPlaceholder")}
              />
              <div className={styles.procList}>
                {filtered.map((item) => (
                  <div
                    key={item.exe}
                    className={styles.procItem}
                    onClick={() => handleSelectExe(item.exe)}
                  >
                    <span style={{ fontWeight: 500 }}>{item.exe}</span>
                    <Badge size="small" appearance="outline">
                      {t("dialogs.clickToAdd")}
                    </Badge>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: "12px", textAlign: "center", color: tokens.colorNeutralForeground4 }}>
                    {t("dialogs.noMatch")}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onCancel}>
              {t("dialogs.close")}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
