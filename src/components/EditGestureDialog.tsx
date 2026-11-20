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
  TabList,
  Tab,
  Subtitle2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Gesture, GestureTrigger } from "../types";
import {
  formatStepSymbol,
  parseStrokeInput,
} from "../utils/gestureSymbols";
import { MousePreview } from "./MousePreview";
import { GestureRecorderCanvas } from "./GestureRecorderCanvas";

const useStyles = makeStyles({
  surface: {
    maxWidth: "480px",
    width: "100%",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    paddingTop: "4px",
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  rowLabel: {
    minWidth: "46px",
    whiteSpace: "nowrap",
    fontWeight: 600,
  },
  rowInput: {
    flex: 1,
    fontSize: tokens.fontSizeBase400,
    fontWeight: 600,
  },
  tabList: {
    marginTop: "2px",
    marginBottom: "4px",
  },
  standardContentRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "28px",
    padding: "8px 0",
  },
  mouseCol: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  gridCol: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 40px)",
    gap: "6px",
  },
  arrowBtn: {
    height: "40px",
    width: "40px",
    minWidth: "40px",
    paddingLeft: "0",
    paddingRight: "0",
    fontSize: tokens.fontSizeBase400,
    fontWeight: 700,
  },
  recordContent: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
});

export type GestureDialogTab = "standard" | "record";

interface EditGestureDialogProps {
  open: boolean;
  gesture: Gesture;
  onSave: (updated: Gesture) => void;
  onCancel: () => void;
}

const DIRECTION_BUTTONS = [
  { key: "UL", label: "↖" },
  { key: "U", label: "↑" },
  { key: "UR", label: "↗" },
  { key: "L", label: "←" },
  { key: "", label: "•" },
  { key: "R", label: "→" },
  { key: "DL", label: "↙" },
  { key: "D", label: "↓" },
  { key: "DR", label: "↘" },
];

function buildCommandString(trig: GestureTrigger, steps: string[]): string {
  const arrowStr = steps.map(formatStepSymbol).join("");
  return `${trig}${arrowStr}`;
}

export const EditGestureDialog: React.FC<EditGestureDialogProps> = ({
  open,
  gesture,
  onSave,
  onCancel,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<GestureDialogTab>("standard");

  // Gesture state
  const [name, setName] = useState(
    t("gestureNames." + gesture.id, { defaultValue: gesture.name })
  );
  const [trigger, setTrigger] = useState<GestureTrigger>(gesture.trigger);
  const [steps, setSteps] = useState<string[]>([...gesture.steps]);
  const [commandText, setCommandText] = useState<string>(
    buildCommandString(gesture.trigger, gesture.steps)
  );

  // Directly edit command string
  const handleCommandTextChange = (raw: string) => {
    setCommandText(raw);
    const parsed = parseStrokeInput(raw, trigger);
    if (parsed.trigger) {
      setTrigger(parsed.trigger as GestureTrigger);
    }
    setSteps(parsed.steps);
  };

  // Click mouse SVG button to change trigger
  const handleSelectTrigger = (newTrigger: GestureTrigger) => {
    setTrigger(newTrigger);
    const updatedCmd = `${newTrigger}${steps.map(formatStepSymbol).join("")}`;
    setCommandText(updatedCmd);
  };

  // Click 3x3 arrow grid button to append stroke
  const handleAddArrow = (dirKey: string, dirLabel: string) => {
    if (!dirKey) return;
    const nextSteps = [...steps, dirKey];
    setSteps(nextSteps);
    setCommandText((prev) => prev + dirLabel);
  };

  // Recording mode finished
  const handleRecordFinished = (recTrigger: GestureTrigger, recSteps: string[]) => {
    setTrigger(recTrigger);
    setSteps(recSteps);
    setCommandText(buildCommandString(recTrigger, recSteps));
  };

  const handleSave = () => {
    // Parse final text in command input box to guarantee 100% sync
    const parsed = parseStrokeInput(commandText, trigger);
    onSave({
      ...gesture,
      name: name.trim() || gesture.name || t("gestures.newGestureName", { defaultValue: "新手勢" }),
      trigger: (parsed.trigger as GestureTrigger) || trigger,
      steps: parsed.steps,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onCancel()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>{gesture.id ? t("dialogs.editGesture") : t("gestures.add")}</DialogTitle>

          <DialogContent className={styles.content}>
            {/* Row 1: Name */}
            <div className={styles.formRow}>
              <Subtitle2 className={styles.rowLabel}>{t("gestures.name")}：</Subtitle2>
              <Input
                className={styles.rowInput}
                value={name}
                onChange={(_, data) => setName(data.value)}
                placeholder={t("dialogs.gestureNamePlaceholder", { defaultValue: "請輸入手勢名稱" })}
              />
            </div>

            {/* Row 2: Command */}
            <div className={styles.formRow}>
              <Subtitle2 className={styles.rowLabel}>{t("dialogs.command", { defaultValue: "指令" })}：</Subtitle2>
              <Input
                className={styles.rowInput}
                value={commandText}
                onChange={(_, data) => handleCommandTextChange(data.value)}
                placeholder="例如 R→↘"
              />
            </div>

            {/* Row 3: Tabs */}
            <TabList
              selectedValue={activeTab}
              onTabSelect={(_, data) => setActiveTab(data.value as GestureDialogTab)}
              className={styles.tabList}
            >
              <Tab value="standard">
                {t("dialogs.tabStandard", { defaultValue: "標準模式" })}
              </Tab>
              <Tab value="record">
                {t("dialogs.tabRecord", { defaultValue: "錄製模式" })}
              </Tab>
            </TabList>

            {/* Row 4: Mode Content */}

            {/* Standard Mode: Mouse SVG on the left, 3x3 Arrow Grid on the right */}
            {activeTab === "standard" && (
              <div className={styles.standardContentRow}>
                <div className={styles.mouseCol}>
                  <MousePreview
                    selectedTrigger={trigger}
                    onSelectTrigger={handleSelectTrigger}
                  />
                </div>

                <div className={styles.gridCol}>
                  <div className={styles.arrowGrid}>
                    {DIRECTION_BUTTONS.map((btn, idx) => (
                      <Button
                        key={idx}
                        appearance={btn.key ? "secondary" : "subtle"}
                        disabled={!btn.key}
                        className={styles.arrowBtn}
                        onClick={() => handleAddArrow(btn.key, btn.label)}
                      >
                        {btn.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Record Mode: Interactive Canvas */}
            {activeTab === "record" && (
              <div className={styles.recordContent}>
                <GestureRecorderCanvas
                  initialTrigger={trigger}
                  onRecordFinished={handleRecordFinished}
                />
              </div>
            )}
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={onCancel}>
              {t("dialogs.cancel")}
            </Button>
            <Button
              appearance="primary"
              onClick={handleSave}
              disabled={activeTab === "record"}
            >
              {t("dialogs.save")}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
