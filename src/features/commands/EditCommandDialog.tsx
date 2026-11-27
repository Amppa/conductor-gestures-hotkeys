import { ACTION_TYPE_LABEL_KEYS } from "./commandPresets";
import React, { useRef, useState } from "react";
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
  Tab,
  TabList,
  makeStyles,
} from "@fluentui/react-components";
import { Action, ActionType } from "../../domain/types";
import { fromAhkKey } from "../../shared/keyMap";
import {
  captureCommandShortcut,
  hasShortcutBaseKey,
  normalizeShortcutValue,
  SPECIAL_SHORTCUT_KEYS,
} from "./commandShortcut";
import { getCommandCategory, SYSTEM_COMMANDS, type CommandCategory } from "../../domain/commandCategories";

type ScriptMode = "script" | "other";

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
  shortcutRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  shortcutInput: {
    flex: 1,
  },
  specialKeyDropdown: {
    flex: 1,
  },
});

interface EditCommandDialogProps {
  open: boolean;
  action: Action;
  category?: CommandCategory;
  onSave: (updated: Action) => void;
  onCancel: () => void;
}

export const EditCommandDialog: React.FC<EditCommandDialogProps> = ({
  open,
  action,
  category = getCommandCategory(action),
  onSave,
  onCancel,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const initialType: ActionType = category === "keyboardCommands" ? "keys" : action.type;
  const initialValue = category === "keyboardCommands" ? normalizeShortcutValue(action.value) : action.value;

  const [name, setName] = useState(action.name);
  const [type, setType] = useState<ActionType>(initialType);
  const [value, setValue] = useState(initialValue);
  const [scriptMode, setScriptMode] = useState<ScriptMode>(initialType === "ahk" ? "script" : "other");
  const [recording, setRecording] = useState(false);
  const shortcutInputRef = useRef<HTMLInputElement>(null);
  const autoNameEnabled = useRef(
    !action.name.trim() ||
      action.name === t("actions.newActionName") ||
      action.name === t("dialogs.unnamedAction"),
  );
  const drafts = useRef<Partial<Record<ActionType, string>>>({ [initialType]: initialValue });

  const formatShortcutDisplay = (ahkValue: string) =>
    ahkValue ? fromAhkKey(ahkValue).replace(/\+/g, " + ") : "";

  const applyShortcut = (nextValue: string, labelOverride?: string) => {
    setValue(nextValue);
    if (autoNameEnabled.current) {
      setName(labelOverride ?? formatShortcutDisplay(nextValue));
    }
  };

  const switchType = (next: ActionType) => {
    drafts.current[type] = value;
    setType(next);
    setValue(drafts.current[next] ?? "");
    setRecording(false);
  };

  const switchScriptMode = (next: ScriptMode) => {
    setScriptMode(next);
    switchType(next === "script" ? "ahk" : "run");
  };

  const handleShortcutKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.repeat) return;
    const captured = captureCommandShortcut(e);
    if (!captured) return;
    applyShortcut(captured);
  };

  const handleFinishRecording = () => {
    setRecording(false);
    shortcutInputRef.current?.blur();
  };

  const handleSave = () => {
    onSave({
      ...action,
      name: name.trim() || t("dialogs.unnamedAction"),
      type,
      value: type === "noop" ? "" : value.trim(),
    });
  };

  const selectedSpecial = SPECIAL_SHORTCUT_KEYS.find((item) => item.value === value);
  const displayShortcut = formatShortcutDisplay(value);
  const canSave = category === "keyboardCommands"
    ? hasShortcutBaseKey(value)
    : !recording && (type === "noop" || Boolean(value.trim()));

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
                onChange={(_, data) => {
                  autoNameEnabled.current = !data.value.trim();
                  setName(data.value);
                }}
                placeholder={t("dialogs.actionNamePlaceholder")}
              />
            </div>

            {category === "scriptCommands" && (
              <TabList selectedValue={scriptMode} onTabSelect={(_, data) => switchScriptMode(data.value as ScriptMode)}>
                <Tab value="script">{t("dialogs.commandScript")}</Tab>
                <Tab value="other">{t("dialogs.commandOther")}</Tab>
              </TabList>
            )}

            {category === "systemCommands" && (
              <div className={styles.presetRow}>
                {SYSTEM_COMMANDS.map((preset) => (
                  <Button
                    key={preset.label}
                    appearance={type === preset.type && value === preset.value ? "primary" : "outline"}
                    onClick={() => {
                      setName(t("dialogs." + preset.label).split(" (")[0]);
                      setType(preset.type);
                      setValue(preset.value);
                    }}
                  >
                    {t("dialogs." + preset.label)}
                  </Button>
                ))}
              </div>
            )}

            {category === "scriptCommands" && scriptMode === "other" && (
              <div className={styles.section}>
                <Subtitle2>{t("dialogs.commandOperation")}：</Subtitle2>
                <Dropdown
                  value={t(ACTION_TYPE_LABEL_KEYS[type])}
                  onOptionSelect={(_, data) => switchType(data.optionValue as ActionType)}
                >
                  <Option value="run">{t("dialogs.typeRun")}</Option>
                  <Option value="noop">{t("dialogs.typeNoop")}</Option>
                </Dropdown>
              </div>
            )}

            {/* Type: No-op */}
            {type === "noop" && (
              <div className={styles.section}>
                <Caption1>{t("dialogs.noopHint")}</Caption1>
              </div>
            )}

            {/* Keyboard Commands: Focus-to-record input + inline special key dropdown */}
            {category === "keyboardCommands" && (
              <>
                <div className={styles.section}>
                  <Subtitle2>{t("dialogs.commandShortcut")}：</Subtitle2>
                  <div className={styles.shortcutRow}>
                    <Input
                      ref={shortcutInputRef}
                      className={styles.shortcutInput}
                      readOnly
                      value={displayShortcut}
                      placeholder={t("dialogs.shortcutStartRecord")}
                      onFocus={() => setRecording(true)}
                      onBlur={() => setRecording(false)}
                      onKeyDown={handleShortcutKeyDown}
                    />
                    <Button
                      appearance={recording ? "primary" : "secondary"}
                      onClick={handleFinishRecording}
                    >
                      {t("dialogs.shortcutDone")}
                    </Button>
                  </div>
                </div>

                <div className={styles.shortcutRow}>
                  <Subtitle2>{t("dialogs.shortcutSpecialKey")}：</Subtitle2>
                  <Dropdown
                    className={styles.specialKeyDropdown}
                    placeholder={t("dialogs.shortcutSpecialKey")}
                    value={selectedSpecial?.label ?? ""}
                    selectedOptions={selectedSpecial ? [selectedSpecial.value] : []}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) {
                        applyShortcut(data.optionValue as string, data.optionText);
                      }
                    }}
                  >
                    {SPECIAL_SHORTCUT_KEYS.map((item) => (
                      <Option key={item.value} value={item.value}>{item.label}</Option>
                    ))}
                  </Dropdown>
                </div>
              </>
            )}

            {/* Type: AHK Script */}
            {category === "scriptCommands" && type === "ahk" && (
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
            <Button appearance="primary" disabled={!canSave} onClick={handleSave}>
              {t("dialogs.save")}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
