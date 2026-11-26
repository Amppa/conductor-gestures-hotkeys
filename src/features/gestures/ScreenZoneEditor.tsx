import { useId } from "react";
import { Button, makeStyles, tokens } from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import { SCREEN_ZONES } from "../../domain/triggers/screen";
import { formatGestureLabel } from "./gestureSymbols";

type Zone = keyof typeof SCREEN_ZONES;
type Mode = "corners" | "edges" | "halves";
const MODES: Mode[] = ["corners", "edges", "halves"];
const ZONES: Record<Mode, { key: Zone; x: number; y: number; width: number; height: number }[]> = {
  corners: [
    { key: "CornerTL", x: 10, y: 10, width: 18, height: 18 },
    { key: "CornerTR", x: 132, y: 10, width: 18, height: 18 },
    { key: "CornerBL", x: 10, y: 72, width: 18, height: 18 },
    { key: "CornerBR", x: 132, y: 72, width: 18, height: 18 },
  ],
  edges: [
    { key: "EdgeTop", x: 28, y: 10, width: 104, height: 12 },
    { key: "EdgeBottom", x: 28, y: 78, width: 104, height: 12 },
    { key: "EdgeLeft", x: 10, y: 28, width: 12, height: 44 },
    { key: "EdgeRight", x: 138, y: 28, width: 12, height: 44 },
  ],
  halves: [
    { key: "EdgeTopLeftHalf", x: 28, y: 10, width: 51, height: 12 },
    { key: "EdgeTopRightHalf", x: 81, y: 10, width: 51, height: 12 },
    { key: "EdgeBottomLeftHalf", x: 28, y: 78, width: 51, height: 12 },
    { key: "EdgeBottomRightHalf", x: 81, y: 78, width: 51, height: 12 },
    { key: "EdgeLeftTopHalf", x: 10, y: 28, width: 12, height: 21 },
    { key: "EdgeLeftBottomHalf", x: 10, y: 51, width: 12, height: 21 },
    { key: "EdgeRightTopHalf", x: 138, y: 28, width: 12, height: 21 },
    { key: "EdgeRightBottomHalf", x: 138, y: 51, width: 12, height: 21 },
  ],
};

const useStyles = makeStyles({
  cards: { display: "flex", flexDirection: "column", gap: "8px" },
  card: {
    padding: "8px 12px", borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`, backgroundColor: tokens.colorNeutralBackground2,
  },
  selected: { border: `1px solid ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorBrandBackground2 },
  heading: { display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, cursor: "pointer" },
  content: { display: "flex", alignItems: "center", justifyContent: "center", gap: "32px" },
  zone: {
    fill: tokens.colorNeutralBackground4, stroke: tokens.colorNeutralStroke1, strokeWidth: 1,
    cursor: "pointer", ":hover": { fill: tokens.colorBrandBackground2Hover },
    ":focus-visible": { stroke: tokens.colorBrandStroke1, strokeWidth: 3, outlineStyle: "none" },
  },
  activeZone: { fill: tokens.colorBrandBackground, stroke: tokens.colorBrandStroke1 },
  wheel: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" },
});

interface ScreenZoneEditorProps {
  trigger: string;
  steps: string[];
  onChange: (trigger: string, steps: string[]) => void;
}

export function ScreenZoneEditor({ trigger, steps, onChange }: ScreenZoneEditorProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const radioName = useId();
  const activeMode: Mode = trigger.startsWith("Corner") ? "corners" : trigger.endsWith("Half") ? "halves" : "edges";
  const select = (mode: Mode, zone?: Zone, wheel = steps[0] === "WD" ? "WD" : "WU") => {
    onChange(zone ?? (activeMode === mode ? trigger : ZONES[mode][0].key), mode === "corners" ? [] : [wheel]);
  };
  return (
    <div className={styles.cards}>
      {MODES.map((mode) => (
        <div key={mode} className={`${styles.card} ${activeMode === mode ? styles.selected : ""}`} onClick={(event) => {
          if (activeMode !== mode && !(event.target as Element).closest("button, input, label, [role='button']")) select(mode);
        }}>
          <label className={styles.heading}>
            <input type="radio" name={radioName} checked={activeMode === mode} onChange={() => select(mode)} />
            {t(`screenEditor.${mode}`)}
          </label>
          <div className={styles.content}>
            <svg width="176" height="110" viewBox="0 0 160 100" role="group" aria-label={t(`screenEditor.${mode}`)}>
              <rect x="10" y="10" width="140" height="80" rx="4" fill={tokens.colorNeutralBackground1} stroke={tokens.colorNeutralStroke1} />
              {ZONES[mode].map(({ key, ...rect }) => (
                <rect key={key} {...rect} rx="2" role="button" tabIndex={0}
                  aria-label={t(`screenLabels.${key}`)} aria-pressed={trigger === key}
                  className={`${styles.zone} ${trigger === key ? styles.activeZone : ""}`}
                  onClick={() => select(mode, key)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(mode, key); } }}>
                  <title>{t(`screenLabels.${key}`)}</title>
                </rect>
              ))}
            </svg>
            {mode !== "corners" && <div className={styles.wheel}>
              <Button size="small" appearance={activeMode === mode && steps[0] === "WU" ? "primary" : "secondary"} onClick={() => select(mode, undefined, "WU")}>{t("triggers.wheelUp")}</Button>
              <svg width="30" height="42" viewBox="0 0 64 88" aria-hidden="true">
                <rect x="12" y="2" width="40" height="84" rx="20" fill={tokens.colorNeutralBackground4} stroke={tokens.colorNeutralStroke1} strokeWidth="1.2" />
                {[22, 33, 44, 55, 66].map((y) => <path key={y} d={`M20 ${y} H44`} stroke={tokens.colorNeutralStroke2} strokeWidth="1.2" />)}
              </svg>
              <Button size="small" appearance={activeMode === mode && steps[0] === "WD" ? "primary" : "secondary"} onClick={() => select(mode, undefined, "WD")}>{t("triggers.wheelDown")}</Button>
            </div>}
          </div>
        </div>
      ))}
      <output aria-live="polite" style={{ color: tokens.colorBrandForeground1, fontWeight: 600 }}>{formatGestureLabel(trigger, steps, t)}</output>
    </div>
  );
}
