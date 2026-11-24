import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles, tokens, Card, Button } from "@fluentui/react-components";
import { Add16Regular, Delete16Regular } from "@fluentui/react-icons";
import { Gesture } from "../../domain/types";
import { normalizeTrigger } from "../../domain/triggerNormalization";
import {
  formatGestureLabel,
} from "./gestureSymbols";
import { EditGestureDialog } from "./EditGestureDialog";
import { PageHeader, usePageStyles } from "../../shared/pageStyles";
import { createId } from "../../shared/ids";

const useStyles = makeStyles({
  tdStroke: {
    padding: "8px 12px",
    userSelect: "none",
  },
  strokeLabel: {
    fontWeight: 600,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorBrandForeground1,
  },
  emptyStroke: {
    color: tokens.colorNeutralForeground4,
    fontStyle: "italic",
  },
});

interface GesturesViewProps {
  screenMode?: boolean;
  gestures: Gesture[];
  onUpdateGestures: (updated: Gesture[]) => void;
}

export const GesturesView: React.FC<GesturesViewProps> = ({
  screenMode = false,
  gestures,
  onUpdateGestures,
}) => {
  const page = usePageStyles();
  const styles = useStyles();
  const { t } = useTranslation();
  const [editingGesture, setEditingGesture] = useState<Gesture | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleOpenAddDialog = () => {
    setIsCreating(true);
    setEditingGesture({
      id: createId("gesture"),
      trigger: screenMode ? "EdgeTop" : "R",
      steps: screenMode ? ["WU"] : [],
    });
  };

  const handleEditGesture = (gesture: Gesture) => {
    setIsCreating(false);
    setEditingGesture(gesture);
  };

  const handleSaveGesture = (saved: Gesture) => {
    const duplicate = gestures.some(
      (gesture) =>
        gesture.id !== saved.id &&
        normalizeTrigger(gesture.trigger) === normalizeTrigger(saved.trigger) &&
        gesture.steps.join(",") === saved.steps.join(","),
    );
    if (duplicate) {
      window.alert(t("gestures.duplicate"));
      return;
    }
    onUpdateGestures(
      isCreating
        ? [...gestures, saved]
        : gestures.map((gesture) => (gesture.id === saved.id ? saved : gesture)),
    );
    setEditingGesture(null);
    setIsCreating(false);
  };

  const handleDeleteGesture = (id: string) => {
    onUpdateGestures(gestures.filter((gesture) => gesture.id !== id));
  };

  return (
    <div className={page.container}>
      <PageHeader
        title={t(screenMode ? "nav.screen" : "nav.gestures")}
        description={screenMode ? t("gestures.screenDescription") : undefined}
      />

      <Card className={page.card}>
        <table className={page.table}>
          <thead>
            <tr>
              <th className={page.th}>{t("gestures.tableStroke")}</th>
              <th className={page.th} style={{ width: "48px" }}></th>
            </tr>
          </thead>
          <tbody>
            {gestures.map((gesture) => {
              const strokeText = formatGestureLabel(gesture.trigger, gesture.steps, t);
              return (
                <tr
                  key={gesture.id}
                  className={`${page.row} ${page.clickableRow}`}
                  onClick={() => handleEditGesture(gesture)}
                  title={t("targets.doubleClickGestureTip")}
                >
                  <td className={styles.tdStroke}>
                    {strokeText ? (
                      <div className={styles.strokeLabel}>{strokeText}</div>
                    ) : (
                      <span className={styles.emptyStroke}>
                        {t("targets.noGesture")}
                      </span>
                    )}
                  </td>
                  <td className={page.opsCell}>
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<Delete16Regular />}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteGesture(gesture.id);
                      }}
                      title={t("gestures.delete")}
                    />
                  </td>
                </tr>
              );
            })}
            {gestures.length === 0 && (
              <tr>
                <td colSpan={2} className={page.emptyCell}>
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
          screenMode={screenMode}
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
