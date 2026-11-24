import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles, tokens, Card, Badge, Button } from "@fluentui/react-components";
import { Add16Regular, Delete16Regular } from "@fluentui/react-icons";
import { Gesture } from "../../domain/types";
import { normalizeTrigger } from "../../domain/triggerNormalization";
import {
  formatGestureLabel,
  formatTemplateName,
  formatTriggerSymbol,
} from "./gestureSymbols";
import { EditGestureDialog } from "./EditGestureDialog";
import { PageHeader, usePageStyles } from "../../shared/pageStyles";
import { createId } from "../../shared/ids";

const useStyles = makeStyles({
  tdName: {
    padding: "8px 12px",
    fontWeight: 600,
    userSelect: "none",
  },
  tdTrigger: {
    width: "120px",
    padding: "8px 12px",
  },
  tdStroke: {
    padding: "8px 12px",
    userSelect: "none",
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
      name: t("gestures.newGestureName"),
      trigger: screenMode ? "EdgeTop" : "R",
      steps: screenMode ? ["WU"] : [],
    });
  };

  const handleEditGesture = (gesture: Gesture) => {
    setIsCreating(false);
    setEditingGesture(gesture);
  };

  const handleSaveGesture = (saved: Gesture) => {
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
      <PageHeader title={t(screenMode ? "nav.screen" : "nav.gestures")} />

      <Card className={page.card}>
        <table className={page.table}>
          <thead>
            <tr>
              <th className={page.th}>{t("gestures.tableName")}</th>
              <th className={page.th} style={{ width: "120px" }}>
                {t("gestures.tableTrigger")}
              </th>
              <th className={page.th}>{t("gestures.tableStroke")}</th>
              <th className={page.th} style={{ width: "48px" }}></th>
            </tr>
          </thead>
          <tbody>
            {gestures.map((gesture) => {
              const trigger = normalizeTrigger(gesture.trigger);
              return (
                <tr
                  key={gesture.id}
                  className={`${page.row} ${page.clickableRow}`}
                  onClick={() => handleEditGesture(gesture)}
                  title={t("targets.doubleClickGestureTip")}
                >
                  <td className={styles.tdName}>{formatTemplateName(t, gesture)}</td>
                  <td className={styles.tdTrigger}>
                    <Badge appearance="tint" color="brand">
                      {formatTriggerSymbol(gesture.trigger, t)}
                    </Badge>
                  </td>
                  <td className={styles.tdStroke}>
                    {gesture.steps.length > 0 ? (
                      formatGestureLabel(gesture.trigger, gesture.steps, t)
                    ) : trigger === "X1" || trigger === "X2" ? (
                      trigger
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
                <td colSpan={4} className={page.emptyCell}>
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
