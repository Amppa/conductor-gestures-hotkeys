import React, { useState } from "react";
import {
  makeStyles,
  tokens,
  Card,
  Subtitle2,
  Caption1,
  Badge,
  Button,
} from "@fluentui/react-components";
import { Add16Regular, Delete16Regular } from "@fluentui/react-icons";
import { Gesture } from "../types";
import { formatGestureLabel, formatTriggerSymbol } from "../utils/gestureSymbols";
import { EditGestureDialog } from "../components/EditGestureDialog";

const useStyles = makeStyles({
  container: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflowY: "auto",
    height: "calc(100% - 48px)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  card: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: tokens.colorNeutralBackground1,
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gestureDisplay: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: 600,
    color: tokens.colorBrandForeground1,
    padding: "6px 10px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    display: "inline-block",
  },
  cardActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "4px",
  },
});

interface GesturesViewProps {
  gestures: Gesture[];
  onUpdateGestures: (updated: Gesture[]) => void;
}

export const GesturesView: React.FC<GesturesViewProps> = ({
  gestures,
  onUpdateGestures,
}) => {
  const styles = useStyles();
  const [editingGesture, setEditingGesture] = useState<Gesture | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleOpenAddDialog = () => {
    setIsCreating(true);
    setEditingGesture({
      id: `gesture-${Date.now()}`,
      name: "新自訂手勢",
      trigger: "R",
      steps: ["R"],
    });
  };

  const handleSaveGesture = (saved: Gesture) => {
    if (isCreating) {
      onUpdateGestures([...gestures, saved]);
    } else {
      onUpdateGestures(
        gestures.map((g) => (g.id === saved.id ? saved : g))
      );
    }
    setEditingGesture(null);
    setIsCreating(false);
  };

  const handleDeleteGesture = (id: string) => {
    onUpdateGestures(gestures.filter((g) => g.id !== id));
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div>
          <Subtitle2>手勢樣板 (Gesture Templates)</Subtitle2>
          <div>
            <Caption1>
              定義可在各應用程式與預設中綁定的手勢方向軌跡與觸發按鍵（支援右鍵 R、中鍵 M 與側鍵 X1/X2 及螢幕邊緣/觸控角）。
            </Caption1>
          </div>
        </div>
        <Button
          appearance="primary"
          icon={<Add16Regular />}
          onClick={handleOpenAddDialog}
        >
          ＋新增手勢樣板
        </Button>
      </div>

      <div className={styles.grid}>
        {gestures.map((gesture) => (
          <Card key={gesture.id} className={styles.card}>
            <div className={styles.header}>
              <span style={{ fontWeight: 600 }}>{gesture.name}</span>
              <Badge appearance="tint" color="brand">
                {formatTriggerSymbol(gesture.trigger)}
              </Badge>
            </div>
            <div>
              <div className={styles.gestureDisplay}>
                {formatGestureLabel(gesture.trigger, gesture.steps)}
              </div>
            </div>
            <div className={styles.cardActions}>
              <Button
                size="small"
                appearance="subtle"
                icon={<Delete16Regular />}
                onClick={() => handleDeleteGesture(gesture.id)}
                title="刪除此手勢樣板"
              />
            </div>
          </Card>
        ))}
      </div>

      {editingGesture && (
        <EditGestureDialog
          open={!!editingGesture}
          gesture={editingGesture}
          onSave={handleSaveGesture}
          onCancel={() => {
            setEditingGesture(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
};
