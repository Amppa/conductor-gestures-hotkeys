import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Select,
  TabList,
  Tab,
  Subtitle2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Gesture, GestureTrigger } from "../../domain/types";
import {
  formatGestureLabel,
} from "./gestureSymbols";
import { parseGestureInput } from "../../domain/triggers/gestureInput";
import { MousePreview } from "./MousePreview";
import { GestureRecorderCanvas } from "./GestureRecorderCanvas";

const useStyles = makeStyles({
  surface: {
    maxWidth: "600px",
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
  screenMode?: boolean;
  open: boolean;
  gesture: Gesture;
  onSave: (updated: Gesture) => void;
  onCancel: () => void;
}

const DIRECTION_BUTTONS = [
  { key: "UL", label: "🡤" },
  { key: "U", label: "🡡" },
  { key: "UR", label: "🡥" },
  { key: "L", label: "🡠" },
  { key: "", label: "•" },
  { key: "R", label: "🡢" },
  { key: "DL", label: "🡧" },
  { key: "D", label: "🡣" },
  { key: "DR", label: "🡦" },
];

function buildCommandString(
  trigger: GestureTrigger,
  steps: string[],
  t: TFunction,
): string {
  return formatGestureLabel(trigger, steps, t);
}

export const EditGestureDialog: React.FC<EditGestureDialogProps> = ({
  screenMode = false,
  open,
  gesture,
  onSave,
  onCancel,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<GestureDialogTab>("standard");
  const [error, setError] = useState<string | null>(null);

  const [trigger, setTrigger] = useState<GestureTrigger>(gesture.trigger);
  const [steps, setSteps] = useState<string[]>([...gesture.steps]);
  const [commandText, setCommandText] = useState<string>(
    buildCommandString(gesture.trigger, gesture.steps, t)
  );

  // Directly edit command string
  const handleCommandTextChange = (raw: string) => {
    setCommandText(raw);
    const parsed = parseGestureInput(raw, trigger);
    if (parsed.trigger) {
      setTrigger(parsed.trigger);
    }
    setSteps(parsed.steps);
  };

  // Click mouse SVG button to change trigger
  const handleSelectTrigger = (newTrigger: GestureTrigger) => {
    const selected = trigger.split("+");
    const next = ["L", "M", "R", "X1", "X2"].filter((key) =>
      key === newTrigger ? !selected.includes(key) : selected.includes(key),
    ).join("+");
    setTrigger(next);
    setCommandText(buildCommandString(next, steps, t));
  };

  // Click 3x3 arrow grid button to append stroke
  const handleAddArrow = (dirKey: string) => {
    if (!dirKey) return;
    const nextSteps = [...steps, dirKey];
    setSteps(nextSteps);
    setCommandText(buildCommandString(trigger, nextSteps, t));
  };

  // Recording mode finished
  const handleRecordFinished = (recTrigger: GestureTrigger, recSteps: string[]) => {
    setTrigger(recTrigger);
    setSteps(recSteps);
    setCommandText(buildCommandString(recTrigger, recSteps, t));
  };

  const handleSave = () => {
    const parsed = parseGestureInput(commandText, trigger);
    setError(parsed.error);
    if (parsed.error) return;
    onSave({
      ...gesture,
      trigger: parsed.trigger || trigger,
      steps: parsed.steps,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onCancel()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>{gesture.id ? t("dialogs.editGesture") : t("gestures.add")}</DialogTitle>

          <DialogContent className={styles.content}>
            {/* Command */}
            <div className={styles.formRow}>
              <Subtitle2 className={styles.rowLabel}>{t("dialogs.command")}：</Subtitle2>
              <Input
                className={styles.rowInput}
                value={commandText}
                onChange={(_, data) => handleCommandTextChange(data.value)}
                placeholder={t("dialogs.gestureStrokePlaceholder")}
              />
            </div>
            {error && <div role="alert">{t(`gestures.${error}`)}</div>}

            {screenMode && <>
              <Select aria-label={t("targets.tableGesture")} value={trigger} onChange={(_, data) => {
                const next = data.value as GestureTrigger;
                const nextSteps = next.startsWith("Corner") ? [] : ["WU"];
                setTrigger(next); setSteps(nextSteps); setCommandText(buildCommandString(next, nextSteps, t));
              }}>
                {["EdgeTop", "EdgeBottom", "EdgeLeft", "EdgeRight", "CornerTL", "CornerTR", "CornerBL", "CornerBR"].map((value) => <option key={value} value={value}>{t(`triggers.${value}`)}</option>)}
              </Select>
              {trigger.startsWith("Edge") && <Select aria-label={t("gestures.stroke")} value={steps[0] ?? "WU"} onChange={(_, data) => {
                setSteps([data.value]); setCommandText(buildCommandString(trigger, [data.value], t));
              }}><option value="WU">{t("triggers.wheelUp")}</option><option value="WD">{t("triggers.wheelDown")}</option></Select>}
            </>}
            {!screenMode && <TabList
              selectedValue={activeTab}
              onTabSelect={(_, data) => setActiveTab(data.value as GestureDialogTab)}
              className={styles.tabList}
            >
              <Tab value="standard">
                {t("dialogs.tabStandard")}
              </Tab>
              <Tab value="record">
                {t("dialogs.tabRecord")}
              </Tab>
            </TabList>}

            {/* Standard Mode: Mouse SVG on the left, 3x3 Arrow Grid on the right */}
            {!screenMode && activeTab === "standard" && (
              <>
              <div style={{ whiteSpace: "pre-line" }}>{t("gestures.inputDescription")}</div>
              <div className={styles.standardContentRow}>
                <div className={styles.mouseCol}>
                  <MousePreview
                    selectedTrigger={trigger}
                    onSelectTrigger={handleSelectTrigger}
                  />
                </div>
                <div aria-hidden="true" style={{ alignSelf: "stretch", width: 1, backgroundColor: tokens.colorNeutralStroke2 }} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <Button onClick={() => handleAddArrow("WU")}>{t("triggers.wheelUp")}</Button>
                  <svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true">
                    <rect x="12" y="2" width="40" height="84" rx="20" fill={tokens.colorNeutralBackground4} stroke={tokens.colorNeutralStroke1} strokeWidth="1.2" />
                    {[22, 33, 44, 55, 66].map((y) => <path key={y} d={`M20 ${y} H44`} stroke={tokens.colorNeutralStroke2} strokeWidth="1.2" />)}
                  </svg>
                  <Button onClick={() => handleAddArrow("WD")}>{t("triggers.wheelDown")}</Button>
                </div>
                <div className={styles.gridCol}>
                  <div className={styles.arrowGrid}>
                    {DIRECTION_BUTTONS.map((btn, idx) => (
                      <Button
                        key={idx}
                        appearance={btn.key ? "secondary" : "subtle"}
                        disabled={!btn.key}
                        className={styles.arrowBtn}
                        onClick={() => handleAddArrow(btn.key)}
                      >
                        {btn.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              </>
            )}

            {/* Record Mode: Interactive Canvas */}
            {!screenMode && activeTab === "record" && (
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
