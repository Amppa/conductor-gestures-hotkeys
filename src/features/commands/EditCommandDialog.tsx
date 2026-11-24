import React, { useState } from "react";
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
  Textarea,
  Dropdown,
  Option,
  Subtitle2,
  Caption1,
  makeStyles,
} from "@fluentui/react-components";
import { Action, ActionType } from "../../domain/types";
import { toAhkKey, fromAhkKey } from "../../shared/keyMap";

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

interface EditCommandDialogProps {
  open: boolean;
  action: Action;
  onSave: (updated: Action) => void;
  onCancel: () => void;
}

interface PresetItem {
  key: string;
  keys: string;
}

const COMMON_HOTKEYS: PresetItem[] = [
  { key: "presetCloseTab", keys: "^w" },
  { key: "presetReopenTab", keys: "^+t" },
  { key: "presetPrevPage", keys: "!{Left}" },
  { key: "presetNextPage", keys: "!{Right}" },
  { key: "presetRefresh", keys: "{F5}" },
  { key: "presetCopy", keys: "^c" },
  { key: "presetPaste", keys: "^v" },
  { key: "presetShowDesktop", keys: "#d" },
  { key: "presetVolUp", keys: "{Volume_Up}" },
  { key: "presetVolDown", keys: "{Volume_Down}" },
];

const ACTION_TYPE_LABEL_KEYS: Record<ActionType, string> = {
  keys: "dialogs.typeKeys",
  ahk: "dialogs.typeAhk",
  run: "dialogs.typeRun",
  noop: "dialogs.typeNoop",
  remap: "dialogs.typeRemap",
  mouse: "dialogs.typeMouse",
  wheel: "dialogs.typeWheel",
};

export const EditCommandDialog: React.FC<EditCommandDialogProps> = ({
  open,
  action,
  onSave,
  onCancel,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
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

  const handleSelectPreset = (preset: PresetItem) => {
    const localized = t("dialogs." + preset.key);
    setName(localized.split(" (")[0]);
    setType("keys");
    setValue(preset.keys);
    setFriendlyKeys(fromAhkKey(preset.keys));
  };

  const handleSave = () => {
    onSave({
      ...action,
      name: name.trim() || t("dialogs.unnamedAction"),
      type,
      value: type === "noop" ? "" : value.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onCancel()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{t("dialogs.editAction")}</DialogTitle>
          <DialogContent className={styles.content}>
            {/* Action Name */}
            <div className={styles.section}>
              <Subtitle2>{t("actions.name")}：</Subtitle2>
              <Input
                value={name}
                onChange={(_, data) => setName(data.value)}
                placeholder={t("dialogs.actionNamePlaceholder")}
              />
            </div>

            {/* Action Type */}
            <div className={styles.section}>
              <Subtitle2>{t("dialogs.actionType")}：</Subtitle2>
              <Dropdown
                value={t(ACTION_TYPE_LABEL_KEYS[type])}
                onOptionSelect={(_, data) => setType(data.optionValue as ActionType)}
              >
                <Option value="keys">{t("dialogs.typeKeys")}</Option>
                <Option value="ahk">{t("dialogs.typeAhk")}</Option>
                <Option value="run">{t("dialogs.typeRun")}</Option>
                <Option value="noop">{t("dialogs.typeNoop")}</Option>
                <Option value="remap">{t("dialogs.typeRemap")}</Option>
              </Dropdown>
            </div>

            {/* Type: No-op */}
            {type === "noop" && (
              <div className={styles.section}>
                <Caption1>{t("dialogs.noopHint")}</Caption1>
              </div>
            )}

            {/* Type: Remap */}
            {type === "remap" && (
              <div className={styles.section}>
                <Subtitle2>{t("dialogs.remapHint")}</Subtitle2>
                <Input
                  value={value}
                  onChange={(_, data) => setValue(data.value)}
                  placeholder="LWin"
                />
              </div>
            )}

            {/* Type: Keys */}
            {type === "keys" && (
              <div className={styles.section}>
                <Subtitle2>{t("dialogs.keysTitle")}</Subtitle2>
                <Input
                  value={friendlyKeys}
                  onKeyDown={handleHotkeyKeyDown}
                  placeholder={t("dialogs.keysPlaceholder")}
                />
                <Caption1>{t("dialogs.ahkCodeHint", { value })}</Caption1>

                <div style={{ marginTop: "6px" }}>
                  <Caption1>{t("dialogs.presetsTitle")}</Caption1>
                  <div className={styles.presetRow}>
                    {COMMON_HOTKEYS.map((preset) => (
                      <Button
                        key={preset.keys}
                        size="small"
                        appearance="outline"
                        onClick={() => handleSelectPreset(preset)}
                      >
                        {t("dialogs." + preset.key)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Type: AHK Script */}
            {type === "ahk" && (
              <div className={styles.section}>
                <Subtitle2>{t("dialogs.ahkSectionTitle")}</Subtitle2>
                <Textarea
                  value={value}
                  onChange={(_, data) => setValue(data.value)}
                  placeholder="WinMinimize('A')"
                  rows={4}
                />
                <Caption1>{t("dialogs.ahkApiHint")}</Caption1>
              </div>
            )}

            {/* Type: Run */}
            {type === "run" && (
              <div className={styles.section}>
                <Subtitle2>{t("dialogs.runSectionTitle")}</Subtitle2>
                <Input
                  value={value}
                  onChange={(_, data) => setValue(data.value)}
                  placeholder={t("dialogs.runPlaceholder")}
                />
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onCancel}>
              {t("dialogs.cancel")}
            </Button>
            <Button appearance="primary" onClick={handleSave}>
              {t("dialogs.save")}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
