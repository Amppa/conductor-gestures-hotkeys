import React, { useState, useEffect } from "react";
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
  const [manualInput, setManualInput] = useState("");
  const [filterText, setFilterText] = useState("");
  const [runningProcesses, setRunningProcesses] = useState<ProcessItem[]>([]);

  useEffect(() => {
    if (!open) return;
    const fetchProcesses = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const procs = await invoke<ProcessItem[]>("get_running_processes");
        if (procs && procs.length > 0) {
          setRunningProcesses(procs);
          return;
        }
      } catch {
        // Fallback for browser testing
      }
      // Fallback preset list
      setRunningProcesses(COMMON_PRESET_EXES.map((exe) => ({ name: exe, exe })));
    };
    fetchProcesses();
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
          <DialogTitle>新增程式至：{targetName}</DialogTitle>
          <DialogContent className={styles.content}>
            {/* Manual input */}
            <div className={styles.section}>
              <Subtitle2>手動輸入執行檔名：</Subtitle2>
              <div className={styles.manualRow}>
                <Input
                  style={{ flex: 1 }}
                  value={manualInput}
                  onChange={(_, data) => setManualInput(data.value)}
                  placeholder="例如：code.exe 或 acad.exe"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleManualAdd();
                    }
                  }}
                />
                <Button appearance="primary" icon={<Add16Regular />} onClick={handleManualAdd}>
                  加入
                </Button>
              </div>
            </div>

            {/* Running processes quick picker */}
            <div className={styles.section}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Subtitle2>點擊目前執行的程式快速加入：</Subtitle2>
                <Caption1>{filtered.length} 個程式</Caption1>
              </div>
              <Input
                contentBefore={<Search16Regular />}
                value={filterText}
                onChange={(_, data) => setFilterText(data.value)}
                placeholder="搜尋執行檔名..."
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
                      點擊加入
                    </Badge>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: "12px", textAlign: "center", color: tokens.colorNeutralForeground4 }}>
                    查無相符的程式
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onCancel}>
              完成 / 關閉
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
