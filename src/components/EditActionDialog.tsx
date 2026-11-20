import React, { useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Textarea,
  Dropdown,
  Option,
  Subtitle2,
  Caption1,
  makeStyles,
} from "@fluentui/react-components";
import { Action, ActionType } from "../types";
import { toAhkKey, fromAhkKey } from "../utils/keyMap";

const useStyles = makeStyles({
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  presetRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "4px",
  },
});

interface EditActionDialogProps {
  open: boolean;
  action: Action;
  onSave: (updated: Action) => void;
  onCancel: () => void;
}

const COMMON_HOTKEYS = [
  { label: "關閉分頁 (Ctrl+W)", keys: "^w" },
  { label: "回復分頁 (Ctrl+Shift+T)", keys: "^+t" },
  { label: "上一頁 (Alt+Left)", keys: "!{Left}" },
  { label: "下一頁 (Alt+Right)", keys: "!{Right}" },
  { label: "重新整理 (F5)", keys: "{F5}" },
  { label: "複製 (Ctrl+C)", keys: "^c" },
  { label: "貼上 (Ctrl+V)", keys: "^v" },
  { label: "顯示桌面 (Win+D)", keys: "#d" },
  { label: "提高音量", keys: "{Volume_Up}" },
  { label: "降低音量", keys: "{Volume_Down}" },
];

export const EditActionDialog: React.FC<EditActionDialogProps> = ({
  open,
  action,
  onSave,
  onCancel,
}) => {
  const styles = useStyles();
  const [name, setName] = useState(action.name);
  const [type, setType] = useState<ActionType>(action.type);
  const [value, setValue] = useState(action.value);
  const [friendlyKeys, setFriendlyKeys] = useState(action.type === "keys" ? fromAhkKey(action.value) : "");

  const handleHotkeyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Tab") return;

    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push("Win");

    const ignoreKeys = ["Control", "Alt", "Shift", "Meta"];
    if (!ignoreKeys.includes(e.key)) {
      const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      parts.push(keyName);
    }

    if (parts.length > 0) {
      const combined = parts.join("+");
      setFriendlyKeys(combined);
      const ahk = toAhkKey(combined);
      setValue(ahk);
    }
  };

  const handleSelectPreset = (preset: { label: string; keys: string }) => {
    setName(preset.label.split(" (")[0]);
    setType("keys");
    setValue(preset.keys);
    setFriendlyKeys(fromAhkKey(preset.keys));
  };

  const handleSave = () => {
    onSave({
      ...action,
      name: name.trim() || "未命名動作",
      type,
      value: value.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onCancel()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>修改動作</DialogTitle>
          <DialogContent className={styles.content}>
            {/* Action Name */}
            <div className={styles.section}>
              <Subtitle2>動作名稱：</Subtitle2>
              <Input
                value={name}
                onChange={(_, data) => setName(data.value)}
                placeholder="例如：關閉分頁、上一頁"
              />
            </div>

            {/* Action Type */}
            <div className={styles.section}>
              <Subtitle2>動作類型：</Subtitle2>
              <Dropdown
                value={type === "keys" ? "鍵盤快速鍵 (keys)" : type === "ahk" ? "原生 AHK 腳本 (ahk)" : "啟動程式/網址 (run)"}
                onOptionSelect={(_, data) => setType(data.optionValue as ActionType)}
              >
                <Option value="keys">鍵盤快速鍵 (keys)</Option>
                <Option value="ahk">原生 AHK 腳本 (ahk)</Option>
                <Option value="run">啟動程式 / 網址 (run)</Option>
              </Dropdown>
            </div>

            {/* Type: Keys */}
            {type === "keys" && (
              <div className={styles.section}>
                <Subtitle2>按鍵組合 (聚焦後直接在鍵盤按下)：</Subtitle2>
                <Input
                  value={friendlyKeys}
                  onKeyDown={handleHotkeyKeyDown}
                  placeholder="點此直接按下快速鍵 (如 Ctrl+W)"
                />
                <Caption1>對應 AHK 代碼：{value}</Caption1>

                <div style={{ marginTop: "6px" }}>
                  <Caption1>常用快速預設：</Caption1>
                  <div className={styles.presetRow}>
                    {COMMON_HOTKEYS.map((preset) => (
                      <Button
                        key={preset.keys}
                        size="small"
                        appearance="outline"
                        onClick={() => handleSelectPreset(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Type: AHK Script */}
            {type === "ahk" && (
              <div className={styles.section}>
                <Subtitle2>AutoHotkey v2 程式碼：</Subtitle2>
                <Textarea
                  value={value}
                  onChange={(_, data) => setValue(data.value)}
                  placeholder="WinMinimize('A')"
                  rows={4}
                />
                <Caption1>可使用完整的 AutoHotkey v2 API (例如 WinMinimize, Run, MsgBox)。</Caption1>
              </div>
            )}

            {/* Type: Run */}
            {type === "run" && (
              <div className={styles.section}>
                <Subtitle2>執行檔案路徑或 URL：</Subtitle2>
                <Input
                  value={value}
                  onChange={(_, data) => setValue(data.value)}
                  placeholder="https://google.com 或 notepad.exe"
                />
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onCancel}>
              取消
            </Button>
            <Button appearance="primary" onClick={handleSave}>
              儲存
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
