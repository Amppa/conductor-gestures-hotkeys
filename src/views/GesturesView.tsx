import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  card: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: tokens.fontSizeBase200,
  },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground3,
    fontWeight: 600,
  },
  tr: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  tdName: {
    padding: "8px 12px",
    fontWeight: 600,
    cursor: "pointer",
    userSelect: "none",
    borderRadius: tokens.borderRadiusSmall,
    transition: "background-color 0.15s ease",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  tdTrigger: {
    width: "120px",
    padding: "8px 12px",
    cursor: "pointer",
    borderRadius: tokens.borderRadiusSmall,
    transition: "background-color 0.15s ease",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  tdStroke: {
    padding: "8px 12px",
    cursor: "pointer",
    userSelect: "none",
    color: tokens.colorBrandForeground1,
    borderRadius: tokens.borderRadiusSmall,
    transition: "background-color 0.15s ease",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  tdOps: {
    width: "48px",
    textAlign: "right",
    padding: "6px 8px",
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
  const { t } = useTranslation();
  const [editingGesture, setEditingGesture] = useState<Gesture | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleOpenAddDialog = () => {
    setIsCreating(true);
    setEditingGesture({
      id: `gesture-${Date.now()}`,
      name: t("gestures.newGestureName", { defaultValue: "新自訂手勢" }),
      trigger: "R",
      steps: [],
    });
  };

  const handleEditGesture = (gesture: Gesture) => {
    setIsCreating(false);
    setEditingGesture(gesture);
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
      <div>
        <Subtitle2>{t("gestures.title")}</Subtitle2>
        <div>
          <Caption1>{t("gestures.subtitle")}</Caption1>
        </div>
      </div>

      <Card className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>{t("gestures.tableName", { defaultValue: "名稱" })}</th>
              <th className={styles.th} style={{ width: "120px" }}>{t("gestures.tableTrigger", { defaultValue: "觸發按鍵" })}</th>
              <th className={styles.th}>{t("gestures.tableStroke", { defaultValue: "手勢筆畫" })}</th>
              <th className={styles.th} style={{ width: "48px" }}></th>
            </tr>
          </thead>
          <tbody>
            {gestures.map((gesture) => (
              <tr key={gesture.id} className={styles.tr}>
                <td
                  className={styles.tdName}
                  onClick={() => handleEditGesture(gesture)}
                  title={t("targets.doubleClickGestureTip")}
                >
                  {t("gestureNames." + gesture.id, { defaultValue: gesture.name })}
                </td>
                <td
                  className={styles.tdTrigger}
                  onClick={() => handleEditGesture(gesture)}
                  title={t("targets.doubleClickGestureTip")}
                >
                  <Badge appearance="tint" color="brand">
                    {formatTriggerSymbol(gesture.trigger, t)}
                  </Badge>
                </td>
                <td
                  className={styles.tdStroke}
                  onClick={() => handleEditGesture(gesture)}
                  title={t("targets.doubleClickGestureTip")}
                >
                  {gesture.steps.length > 0 ? (
                    formatGestureLabel(gesture.trigger, gesture.steps, t)
                  ) : (
                    <span style={{ color: tokens.colorNeutralForeground4, fontStyle: "italic" }}>
                      {t("targets.noGesture")}
                    </span>
                  )}
                </td>
                <td className={styles.tdOps}>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Delete16Regular />}
                    onClick={() => handleDeleteGesture(gesture.id)}
                    title={t("gestures.delete")}
                  />
                </td>
              </tr>
            ))}
            {gestures.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: "16px", textAlign: "center", color: tokens.colorNeutralForeground4 }}>
                  {t("targets.emptyBindings")}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div>
          <Button
            size="small"
            appearance="subtle"
            icon={<Add16Regular />}
            onClick={handleOpenAddDialog}
          >
            {t("gestures.add")}
          </Button>
        </div>
      </Card>

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
