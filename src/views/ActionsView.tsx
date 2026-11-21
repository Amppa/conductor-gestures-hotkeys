import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  makeStyles,
  tokens,
  Title3,
  Divider,
  Card,
  Caption1,
  Badge,
  Button,
} from "@fluentui/react-components";
import { Add16Regular, Delete16Regular } from "@fluentui/react-icons";
import { Action } from "../types";
import { EditActionDialog } from "../components/EditActionDialog";

const useStyles = makeStyles({
  container: {
    padding: "16px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minHeight: "100%",
    boxSizing: "border-box",
    justifyContent: "flex-start",
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flexShrink: 0,
  },
  pageTitle: {
    fontSize: "20px",
    lineHeight: "24px",
    fontWeight: tokens.fontWeightSemibold,
    margin: "0 !important",
    padding: 0,
  },
  divider: {
    margin: "0 !important",
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
    cursor: "pointer",
    transition: "background-color 0.15s ease",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
  tdName: {
    padding: "8px 12px",
    fontWeight: 600,
    userSelect: "none",
  },
  tdType: {
    width: "120px",
    padding: "8px 12px",
  },
  tdAction: {
    padding: "8px 12px",
    userSelect: "none",
    color: tokens.colorBrandForeground1,
  },
  codeValue: {
    fontFamily: "Consolas, 'Cascadia Code', monospace",
    fontSize: tokens.fontSizeBase200,
    padding: "2px 6px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    wordBreak: "break-all",
  },
  tdOps: {
    width: "48px",
    textAlign: "right",
    padding: "6px 8px",
  },
});

interface ActionsViewProps {
  actions: Action[];
  onUpdateActions?: (updated: Action[]) => void;
}

export const ActionsView: React.FC<ActionsViewProps> = ({
  actions,
  onUpdateActions,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleOpenAddDialog = () => {
    setIsCreating(true);
    setEditingAction({
      id: `action-${Date.now()}`,
      name: t("actions.newActionName"),
      type: "keys",
      value: "",
    });
  };

  const handleEditAction = (action: Action) => {
    setIsCreating(false);
    setEditingAction(action);
  };

  const handleSaveAction = (saved: Action) => {
    if (!onUpdateActions) return;
    if (isCreating) {
      onUpdateActions([...actions, saved]);
    } else {
      onUpdateActions(actions.map((a) => (a.id === saved.id ? saved : a)));
    }
    setEditingAction(null);
    setIsCreating(false);
  };

  const handleDeleteAction = (id: string) => {
    if (!onUpdateActions) return;
    onUpdateActions(actions.filter((a) => a.id !== id));
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <Title3 as="h1" className={styles.pageTitle}>{t("nav.actions")}</Title3>
        <Divider className={styles.divider} />
      </div>

      <Card className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>{t("actions.tableName")}</th>
              <th className={styles.th} style={{ width: "120px" }}>{t("actions.tableType")}</th>
              <th className={styles.th}>{t("actions.tableAction")}</th>
              <th className={styles.th} style={{ width: "48px" }}></th>
            </tr>
          </thead>
          <tbody>
            {actions.map((act) => (
              <tr
                key={act.id}
                className={styles.tr}
                onClick={() => handleEditAction(act)}
                title={t("targets.doubleClickActionTip")}
              >
                <td className={styles.tdName}>
                  {t("actionNames." + act.id, { defaultValue: act.name })}
                </td>
                <td className={styles.tdType}>
                  <Badge appearance="tint" color="informative">
                    {act.type}
                  </Badge>
                </td>
                <td className={styles.tdAction}>
                  <span className={styles.codeValue}>{act.value || t("actions.emptyValue")}</span>
                </td>
                <td className={styles.tdOps}>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Delete16Regular />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAction(act.id);
                    }}
                    title={t("actions.deleteTip")}
                  />
                </td>
              </tr>
            ))}
            {actions.length === 0 && (
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
            {t("actions.addAction")}
          </Button>
        </div>
      </Card>

      {editingAction && (
        <EditActionDialog
          open={!!editingAction}
          action={editingAction}
          onSave={handleSaveAction}
          onCancel={() => {
            setEditingAction(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
};
