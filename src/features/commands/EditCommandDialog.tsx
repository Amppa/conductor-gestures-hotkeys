import { COMMON_HOTKEYS, ACTION_TYPE_LABEL_KEYS, type PresetItem } from "./commandPresets";
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
import { captureCommandShortcut } from "./commandShortcut";
import { getCommandCategory, SYSTEM_COMMANDS, type CommandCategory } from "../../domain/commandCategories";

type CommandMode = "common" | "keys" | "remap" | "script" | "other";

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
  const [name, setName] = useState(action.name);
  const [type, setType] = useState<ActionType>(action.type);
  const [value, setValue] = useState(action.value);
  const [mode, setMode] = useState<CommandMode>(action.type === "remap" ? "remap" : category === "scriptCommands" ? (action.type === "ahk" ? "script" : "other") : action.type === "keys"
    ? (!action.value || COMMON_HOTKEYS.some((preset) => preset.keys === action.value) ? "common" : "keys")
    : action.type === "ahk" ? "script" : "other");
  const [recording, setRecording] = useState(false);
  const drafts = useRef<Partial<Record<ActionType, string>>>({ [action.type]: action.value });

  const switchType = (next: ActionType) => {
    drafts.current[type] = value;
    setType(next);
    setValue(drafts.current[next] ?? "");
    setRecording(false);
  };
  const switchMode = (next: CommandMode) => {
    setMode(next);
    switchType(next === "script" ? "ahk" : next === "other" ? "run" : next === "remap" ? "remap" : "keys");
  };

  const handleHotkeyKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.repeat) return;
    const captured = captureCommandShortcut(e);
    if (!captured) return;
    setValue(captured);
    setRecording(false);
  };

  const handleSelectPreset = (preset: PresetItem) => {
    const localized = t("dialogs." + preset.key);
    setName(localized.split(" (")[0]);
    setType("keys");
    setValue(preset.keys);
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

            {category !== "systemCommands" && <TabList selectedValue={mode} onTabSelect={(_, data) => switchMode(data.value as CommandMode)}>
              {category === "keyboardCommands" ? <>
                <Tab value="common">{t("dialogs.commandCommon")}</Tab>
                <Tab value="keys">{t("dialogs.commandShortcut")}</Tab>
                <Tab value="remap">{t("dialogs.typeRemap")}</Tab>
              </> : <>
                <Tab value="script">{t("dialogs.commandScript")}</Tab>
                <Tab value="other">{t("dialogs.commandOther")}</Tab>
              </>}
            </TabList>}
            {category === "systemCommands" && <div className={styles.presetRow}>
              {SYSTEM_COMMANDS.map((preset) => <Button key={preset.label}
                appearance={type === preset.type && value === preset.value ? "primary" : "outline"}
                onClick={() => { setName(t("dialogs." + preset.label).split(" (")[0]); setType(preset.type); setValue(preset.value); }}>
                {t("dialogs." + preset.label)}
              </Button>)}
            </div>}
            {category === "keyboardCommands" && mode === "common" && <div className={styles.presetRow}>
              {COMMON_HOTKEYS.filter((preset) => getCommandCategory({ type: "keys", value: preset.keys }) === "keyboardCommands").map((preset) => <Button key={preset.keys}
                appearance={value === preset.keys ? "primary" : "outline"}
                onClick={() => handleSelectPreset(preset)}>{t("dialogs." + preset.key)}</Button>)}
            </div>}
            {category === "scriptCommands" && mode === "other" &&
            <div className={styles.section}>
              <Subtitle2>{t("dialogs.commandOperation")}：</Subtitle2>
              <Dropdown
                value={t(ACTION_TYPE_LABEL_KEYS[type])}
                onOptionSelect={(_, data) => switchType(data.optionValue as ActionType)}
              >
                <Option value="run">{t("dialogs.typeRun")}</Option>
                <Option value="noop">{t("dialogs.typeNoop")}</Option>
              </Dropdown>
            </div>}

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
            {category === "keyboardCommands" && mode === "keys" && (
              <div className={styles.section}>
                <div aria-live="polite">
                  {value ? fromAhkKey(value).split("+").map((key, index) => <kbd key={index} style={{ display: "inline-block", padding: "4px 8px", marginRight: "4px", border: "1px solid currentColor", borderRadius: "4px" }}>{key}</kbd>) : t("dialogs.shortcutEmpty")}
                </div>
                <Button appearance={recording ? "primary" : "secondary"}
                  onClick={() => setRecording(!recording)} onKeyDown={handleHotkeyKeyDown}
                  onBlur={() => setRecording(false)}>
                  {t(recording ? "dialogs.shortcutStop" : "dialogs.shortcutRecord")}
                </Button>
                <Caption1>{t(recording ? "dialogs.shortcutListening" : "dialogs.shortcutHint")}</Caption1>
              </div>
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
            <Button appearance="primary" disabled={recording || (type !== "noop" && !value.trim())} onClick={handleSave}>
              {t("dialogs.save")}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
