import React, { useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Dropdown,
  Option,
  Subtitle2,
  Caption1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Delete16Regular, ArrowUndo16Regular } from "@fluentui/react-icons";
import { Gesture, GestureTrigger } from "../types";
import { formatStepSymbol, formatTriggerSymbol } from "../utils/gestureSymbols";

const useStyles = makeStyles({
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  arrowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    maxWidth: "240px",
    margin: "8px auto",
  },
  arrowBtn: {
    height: "44px",
    fontSize: tokens.fontSizeBase500,
    fontWeight: 600,
  },
  sequenceDisplay: {
    minHeight: "44px",
    padding: "8px 12px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sequenceSteps: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: tokens.fontSizeBase400,
    fontWeight: 600,
    color: tokens.colorBrandForeground1,
  },
});

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
  { key: "", label: "•" }, // Center empty placeholder
  { key: "R", label: "→" },
  { key: "DL", label: "↙" },
  { key: "D", label: "↓" },
  { key: "DR", label: "↘" },
];

const TRIGGER_OPTIONS: { value: GestureTrigger; label: string }[] = [
  { value: "R", label: "R (右鍵劃手勢)" },
  { value: "M", label: "M (中鍵劃手勢)" },
  { value: "X1", label: "X1 (側鍵1劃手勢)" },
  { value: "X2", label: "X2 (側鍵2劃手勢)" },
  { value: "CornerTL", label: "左上觸控角 (CornerTL)" },
  { value: "CornerTR", label: "右上觸控角 (CornerTR)" },
  { value: "CornerBL", label: "左下觸控角 (CornerBL)" },
  { value: "CornerBR", label: "右下觸控角 (CornerBR)" },
  { value: "EdgeTopR", label: "頂部右側邊緣 (EdgeTopR)" },
  { value: "EdgeTopL", label: "頂部左側邊緣 (EdgeTopL)" },
  { value: "EdgeLeft", label: "左側邊緣 (EdgeLeft)" },
  { value: "EdgeRight", label: "右側邊緣 (EdgeRight)" },
];

export const EditGestureDialog: React.FC<EditGestureDialogProps> = ({
  open,
  gesture,
  onSave,
  onCancel,
}) => {
  const styles = useStyles();
  const [trigger, setTrigger] = useState<GestureTrigger>(gesture.trigger);
  const [steps, setSteps] = useState<string[]>([...gesture.steps]);

  const isSpatialTrigger = trigger.startsWith("Corner") || trigger.startsWith("Edge");

  const handleAddStep = (dir: string) => {
    if (!dir) return;
    setSteps((prev) => [...prev, dir]);
  };

  const handleUndo = () => {
    setSteps((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setSteps([]);
  };

  const handleSave = () => {
    onSave({
      ...gesture,
      trigger,
      steps,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onCancel()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>修改手勢</DialogTitle>
          <DialogContent className={styles.content}>
            {/* Trigger Selection */}
            <div className={styles.section}>
              <Subtitle2>觸發按鍵 / 空間區域：</Subtitle2>
              <Dropdown
                value={TRIGGER_OPTIONS.find((o) => o.value === trigger)?.label || trigger}
                onOptionSelect={(_, data) => setTrigger(data.optionValue as GestureTrigger)}
              >
                {TRIGGER_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Dropdown>
            </div>

            {/* Sequence display & controls */}
            <div className={styles.section}>
              <Subtitle2>手勢軌跡序列：</Subtitle2>
              <div className={styles.sequenceDisplay}>
                <div className={styles.sequenceSteps}>
                  <span>{formatTriggerSymbol(trigger)}</span>
                  <span>:</span>
                  {steps.length === 0 ? (
                    <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>無步驟 (單擊或觸控角)</Caption1>
                  ) : (
                    steps.map((s, i) => (
                      <span key={i}>
                        {formatStepSymbol(s)}
                        {i < steps.length - 1 && " "}
                      </span>
                    ))
                  )}
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<ArrowUndo16Regular />}
                    onClick={handleUndo}
                    title="復原一步"
                    disabled={steps.length === 0}
                  />
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Delete16Regular />}
                    onClick={handleClear}
                    title="全部清除"
                    disabled={steps.length === 0}
                  />
                </div>
              </div>
            </div>

            {/* 8-Direction Button Grid (for stroke gestures) */}
            {!isSpatialTrigger && (
              <div className={styles.section}>
                <Caption1 style={{ textAlign: "center" }}>點擊方向箭頭串接筆劃：</Caption1>
                <div className={styles.arrowGrid}>
                  {DIRECTION_BUTTONS.map((btn, idx) => (
                    <Button
                      key={idx}
                      className={styles.arrowBtn}
                      appearance={btn.key ? "secondary" : "subtle"}
                      disabled={!btn.key}
                      onClick={() => handleAddStep(btn.key)}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </div>

                {/* Quick Chord Wheel buttons */}
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "4px" }}>
                  <Button size="small" appearance="outline" onClick={() => handleAddStep("WU")}>
                    + 滾輪上 (W↑)
                  </Button>
                  <Button size="small" appearance="outline" onClick={() => handleAddStep("WD")}>
                    + 滾輪下 (W↓)
                  </Button>
                </div>
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
