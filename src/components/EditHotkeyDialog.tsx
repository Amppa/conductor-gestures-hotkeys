import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import { Gesture } from "../types";
import {
  formatHotkeyTrigger,
  keyboardEventToTrigger,
} from "../utils/hotkeyTrigger";

const useStyles = makeStyles({
  surface: {
    maxWidth: "440px",
    width: "100%",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    paddingTop: "4px",
  },
  captureInput: {
    fontFamily: tokens.fontFamilyMonospace,
    fontWeight: tokens.fontWeightSemibold,
  },
});

interface EditHotkeyDialogProps {
  hotkey: Gesture;
  existingHotkeys: Gesture[];
  isCreating: boolean;
  onSave: (hotkey: Gesture) => void;
  onCancel: () => void;
}

function getAutomaticName(trigger: string, t: (key: string) => string): string {
  switch (trigger) {
    case "LCtrl":
      return t("hotkeys.keyNameLCtrl");
    case "RCtrl":
      return t("hotkeys.keyNameRCtrl");
    case "LShift":
      return t("hotkeys.keyNameLShift");
    case "RShift":
      return t("hotkeys.keyNameRShift");
    case "LAlt":
      return t("hotkeys.keyNameLAlt");
    case "RAlt":
      return t("hotkeys.keyNameRAlt");
    case "LWin":
      return t("hotkeys.keyNameLWin");
    case "RWin":
      return t("hotkeys.keyNameRWin");
    default:
      return formatHotkeyTrigger(trigger);
  }
}

export const EditHotkeyDialog: React.FC<EditHotkeyDialogProps> = ({
  hotkey,
  existingHotkeys,
  isCreating,
  onSave,
  onCancel,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [name, setName] = useState(hotkey.name);
  const [trigger, setTrigger] = useState(hotkey.trigger);
  const [isNameCustomized, setIsNameCustomized] = useState(
    !isCreating && hotkey.name.trim().length > 0
  );

  const duplicate = existingHotkeys.some(
    (item) =>
      item.id !== hotkey.id &&
      item.trigger.toLowerCase() === trigger.toLowerCase()
  );
  const canSave = name.trim().length > 0 && trigger.length > 0 && !duplicate;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;
    const captured = keyboardEventToTrigger(event);
    if (!captured) return;
    setTrigger(captured);
    if (!isNameCustomized) {
      setName(getAutomaticName(captured, t));
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...hotkey,
      name: name.trim(),
      trigger,
      steps: [],
    });
  };

  return (
    <Dialog open onOpenChange={(_, data) => !data.open && onCancel()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>
            {t(isCreating ? "hotkeys.addTitle" : "hotkeys.editTitle")}
          </DialogTitle>
          <DialogContent className={styles.content}>
            <Field label={t("hotkeys.nameLabel")} required>
              <Input
                value={name}
                onChange={(_, data) => {
                  setName(data.value);
                  setIsNameCustomized(data.value.trim().length > 0);
                }}
                placeholder={t("hotkeys.namePlaceholder")}
              />
            </Field>
            <Field
              label={t("hotkeys.keyLabel")}
              hint={duplicate ? t("hotkeys.duplicate") : t("hotkeys.captureHint")}
              validationState={duplicate ? "error" : "none"}
              required
            >
              <Input
                className={styles.captureInput}
                value={formatHotkeyTrigger(trigger)}
                readOnly
                onKeyDown={handleKeyDown}
                placeholder={t("hotkeys.capturePlaceholder")}
              />
            </Field>
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
