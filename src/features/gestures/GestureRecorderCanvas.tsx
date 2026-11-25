import React, { useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles, tokens, Caption1 } from "@fluentui/react-components";
import { GestureTrigger } from "../../domain/types";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
  },
  canvasWrapper: {
    position: "relative",
    width: "100%",
    height: "220px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    overflow: "hidden",
    cursor: "not-allowed",
    touchAction: "none",
    pointerEvents: "none",
    opacity: 0.7,
  },
  canvas: {
    width: "100%",
    height: "100%",
    display: "block",
    touchAction: "none",
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    textAlign: "center",
    color: tokens.colorNeutralForeground4,
    userSelect: "none",
  },
  statusBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    borderLeft: `1px solid ${tokens.colorNeutralStroke3}`,
    borderRight: `1px solid ${tokens.colorNeutralStroke3}`,
  },
});

interface GestureRecorderCanvasProps {
  initialTrigger?: GestureTrigger;
  onRecordFinished: (trigger: GestureTrigger, steps: string[]) => void;
}

// Direction calculation identical to core engine
function getDirection(dx: number, dy: number): string {
  const rad = Math.atan2(dy, dx);
  const deg = ((rad * 180) / Math.PI + 360) % 360;

  if (deg >= 337.5 || deg < 22.5) return "R";
  if (deg >= 22.5 && deg < 67.5) return "DR";
  if (deg >= 67.5 && deg < 112.5) return "D";
  if (deg >= 112.5 && deg < 157.5) return "DL";
  if (deg >= 157.5 && deg < 202.5) return "L";
  if (deg >= 202.5 && deg < 247.5) return "UL";
  if (deg >= 247.5 && deg < 292.5) return "U";
  return "UR";
}

export const GestureRecorderCanvas: React.FC<GestureRecorderCanvasProps> = ({
  initialTrigger = "R",
  onRecordFinished,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synchronous tracking state to prevent React state batching latency
  const trackingRef = useRef<{
    isRecording: boolean;
    trigger: GestureTrigger;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    steps: string[];
    isDrawing: boolean;
  }>({
    isRecording: false,
    trigger: initialTrigger,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    steps: [],
    isDrawing: false,
  });

  const THRESHOLD = 10;
  const STEP_THRESHOLD = 14;

  // Resize canvas according to client dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.parentElement?.clientWidth || 460;
    canvas.height = canvas.parentElement?.clientHeight || 220;
  }, []);

  // Multi-tier finish handler: guaranteed to execute whether released via pointerup, mouseup, or contextmenu
  const finishRecording = useCallback((e?: Event | React.SyntheticEvent) => {
    if (!trackingRef.current.isRecording) return;
    if (e) {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch {}
    }
    trackingRef.current.isRecording = false;

    // Clean up window listeners
    window.removeEventListener("pointerup", handleGlobalRelease, true);
    window.removeEventListener("mouseup", handleGlobalRelease, true);
    window.removeEventListener("contextmenu", handleGlobalContextMenu, true);
    window.removeEventListener("pointercancel", handleGlobalRelease, true);

    const { trigger: finalTrigger, steps: finalSteps } = trackingRef.current;
    onRecordFinished(finalTrigger, [...finalSteps]);
  }, [onRecordFinished]);

  const handleGlobalRelease = useCallback((e: MouseEvent | PointerEvent) => {
    finishRecording(e);
  }, [finishRecording]);

  const handleGlobalContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    finishRecording(e);
  }, [finishRecording]);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointerup", handleGlobalRelease, true);
      window.removeEventListener("mouseup", handleGlobalRelease, true);
      window.removeEventListener("contextmenu", handleGlobalContextMenu, true);
      window.removeEventListener("pointercancel", handleGlobalRelease, true);
    };
  }, [handleGlobalRelease, handleGlobalContextMenu]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Listen on window capture phase so right-click release or contextmenu is never swallowed
    window.addEventListener("pointerup", handleGlobalRelease, true);
    window.addEventListener("mouseup", handleGlobalRelease, true);
    window.addEventListener("contextmenu", handleGlobalContextMenu, true);
    window.addEventListener("pointercancel", handleGlobalRelease, true);

    // Only set pointer capture for left click (Chromium can swallow pointerup on right-click capture)
    if (e.button === 0) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Map mouse button to gesture trigger key
    let trig: GestureTrigger = "R";
    if (e.button === 0) trig = "L";
    else if (e.button === 1) trig = "M";
    else if (e.button === 2) trig = "R";
    else if (e.button === 3) trig = "X1";
    else if (e.button === 4) trig = "X2";

    // Set synchronous tracking state first
    trackingRef.current = {
      isRecording: true,
      trigger: trig,
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
      steps: [],
      isDrawing: false,
    };


    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#0078d4";
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!trackingRef.current.isRecording) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const t = trackingRef.current;

    // Draw continuous trail segment
    ctx.beginPath();
    ctx.moveTo(t.lastX, t.lastY);
    ctx.lineTo(curX, curY);
    ctx.strokeStyle = "#0078d4";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    const dxTotal = curX - t.startX;
    const dyTotal = curY - t.startY;
    const totalDist = Math.sqrt(dxTotal * dxTotal + dyTotal * dyTotal);

    if (!t.isDrawing) {
      if (totalDist >= THRESHOLD) {
        t.isDrawing = true;
        const dir = getDirection(dxTotal, dyTotal);
        t.steps.push(dir);
        t.lastX = curX;
        t.lastY = curY;
      }
    } else {
      const dxStep = curX - t.lastX;
      const dyStep = curY - t.lastY;
      const stepDist = Math.sqrt(dxStep * dxStep + dyStep * dyStep);

      if (stepDist >= STEP_THRESHOLD) {
        const dir = getDirection(dxStep, dyStep);
        if (t.steps.length === 0 || t.steps[t.steps.length - 1] !== dir) {
          t.steps.push(dir);
        }
        t.lastX = curX;
        t.lastY = curY;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    finishRecording(e);
  };

  return (
    <div className={styles.container}>
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            finishRecording(e);
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        <div className={styles.watermark}>
          <span style={{ fontSize: tokens.fontSizeBase400, color: tokens.colorNeutralForeground3 }}>
            {t("common.inDevelopment")}
          </span>
        </div>
      </div>

      <div className={styles.statusBar} style={{ opacity: 0.6, justifyContent: "center" }}>
        <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>{t("common.inDevelopment")}</Caption1>
      </div>
    </div>
  );
};
