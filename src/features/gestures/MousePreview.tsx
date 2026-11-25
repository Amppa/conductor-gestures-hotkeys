import React from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import { GestureTrigger } from "../../domain/types";

const useStyles = makeStyles({
  container: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  svg: {
    width: "100px",
    height: "140px",
    userSelect: "none",
    display: "block",
  },
  mouseBody: {
    fill: tokens.colorNeutralBackground3,
    stroke: tokens.colorNeutralStroke1,
    strokeWidth: 1.5,
  },
  button: {
    cursor: "pointer",
    transition: "all 0.15s ease",
    fill: tokens.colorNeutralBackground1,
    stroke: tokens.colorNeutralStroke2,
    strokeWidth: 1.2,
    ":hover": {
      fill: tokens.colorBrandBackground2,
      stroke: tokens.colorBrandStroke1,
    },
  },
  buttonActive: {
    fill: tokens.colorBrandBackground,
    stroke: tokens.colorBrandStroke1,
    strokeWidth: 1.8,
    filter: "drop-shadow(0 2px 4px rgba(0, 120, 212, 0.4))",
  },
  btnText: {
    fontSize: "11px",
    fontWeight: 700,
    fill: tokens.colorNeutralForeground1,
    textAnchor: "middle",
    dominantBaseline: "central",
    pointerEvents: "none",
  },
  btnTextActive: {
    fontSize: "12px",
    fontWeight: 800,
    fill: "#ffffff",
    textAnchor: "middle",
    dominantBaseline: "central",
    pointerEvents: "none",
  },
  sideBtnText: {
    fontSize: "8px",
    fontWeight: 700,
    fill: tokens.colorNeutralForeground1,
    textAnchor: "middle",
    dominantBaseline: "central",
    pointerEvents: "none",
  },
  sideBtnTextActive: {
    fontSize: "8.5px",
    fontWeight: 800,
    fill: "#ffffff",
    textAnchor: "middle",
    dominantBaseline: "central",
    pointerEvents: "none",
  },
  wheel: {
    cursor: "pointer",
    transition: "all 0.15s ease",
    fill: tokens.colorNeutralBackground4,
    stroke: tokens.colorNeutralStroke1,
    strokeWidth: 1.2,
    ":hover": {
      fill: tokens.colorBrandBackground2,
      stroke: tokens.colorBrandStroke1,
    },
  },
  wheelActive: {
    fill: tokens.colorBrandBackground,
    stroke: tokens.colorBrandStroke1,
    strokeWidth: 1.8,
    filter: "drop-shadow(0 2px 4px rgba(0, 120, 212, 0.4))",
  },
});

interface MousePreviewProps {
  selectedTrigger: GestureTrigger;
  onSelectTrigger: (trigger: GestureTrigger) => void;
}

export const MousePreview: React.FC<MousePreviewProps> = ({
  selectedTrigger,
  onSelectTrigger,
}) => {
  const styles = useStyles();

  const selected = selectedTrigger.split("+");
  const isL = selected.includes("L");
  const isR = selected.includes("R");
  const isM = selected.includes("M");
  const isX1 = selected.includes("X1");
  const isX2 = selected.includes("X2");

  return (
    <div className={styles.container}>
      <svg viewBox="0 0 100 140" className={styles.svg}>
        {/* Pill-shaped Mouse Silhouette */}
        <rect
          x="16"
          y="8"
          width="68"
          height="124"
          rx="34"
          ry="34"
          className={styles.mouseBody}
        />

        {/* Side Button 2 (X2 - Forward, Upper-left tab) */}
        <rect
          x="8"
          y="42"
          width="7"
          height="20"
          rx="3"
          className={`${styles.button} ${isX2 ? styles.buttonActive : ""}`}
          onClick={() => onSelectTrigger("X2")}
        />
        <text x="11.5" y="52" className={isX2 ? styles.sideBtnTextActive : styles.sideBtnText}>
          X2
        </text>

        {/* Side Button 1 (X1 - Back, Lower-left tab) */}
        <rect
          x="8"
          y="66"
          width="7"
          height="20"
          rx="3"
          className={`${styles.button} ${isX1 ? styles.buttonActive : ""}`}
          onClick={() => onSelectTrigger("X1")}
        />
        <text x="11.5" y="76" className={isX1 ? styles.sideBtnTextActive : styles.sideBtnText}>
          X1
        </text>

        {/* Left Click Button (L - Top Left Arc) */}
        <path
          d="M 16 42 A 34 34 0 0 1 48 8.1 L 48 52 L 16 52 Z"
          className={`${styles.button} ${isL ? styles.buttonActive : ""}`}
          onClick={() => onSelectTrigger("L")}
        />
        <text x="32" y="32" className={isL ? styles.btnTextActive : styles.btnText}>
          L
        </text>

        {/* Right Click Button (R - Top Right Arc) */}
        <path
          d="M 52 8.1 A 34 34 0 0 1 84 42 L 84 52 L 52 52 Z"
          className={`${styles.button} ${isR ? styles.buttonActive : ""}`}
          onClick={() => onSelectTrigger("R")}
        />
        <text x="68" y="32" className={isR ? styles.btnTextActive : styles.btnText}>
          R
        </text>

        {/* Middle Wheel Capsule (M - Center) */}
        <rect
          x="46"
          y="20"
          width="8"
          height="26"
          rx="4"
          className={`${styles.wheel} ${isM ? styles.wheelActive : ""}`}
          onClick={() => onSelectTrigger("M")}
        />
        <line x1="47" y1="27" x2="53" y2="27" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
        <line x1="47" y1="33" x2="53" y2="33" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
        <line x1="47" y1="39" x2="53" y2="39" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
        <text x="50" y="58" className={isM ? styles.btnTextActive : styles.btnText}>
          M
        </text>
      </svg>
    </div>
  );
};
