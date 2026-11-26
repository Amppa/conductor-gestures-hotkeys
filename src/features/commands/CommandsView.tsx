import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles, tokens, Card, Button } from "@fluentui/react-components";
import { getCommandCategory, type CommandCategory } from "../../domain/commandCategories";
import { Add16Regular, Delete16Regular } from "@fluentui/react-icons";
import { Action } from "../../domain/types";
import { EditCommandDialog } from "./EditCommandDialog";
import { PageHeader, usePageStyles } from "../../shared/pageStyles";
import { formatActionName } from "../../shared/displayNames";
import { createId } from "../../shared/ids";

const useStyles = makeStyles({
  tdName: {
    padding: "8px 12px",
    fontWeight: 600,
    userSelect: "none",
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
});

interface CommandsViewProps {
  category: CommandCategory;
  actions: Action[];
  onUpdateActions?: (updated: Action[]) => void;
}

export const CommandsView: React.FC<CommandsViewProps> = ({
  actions,
  category,
  onUpdateActions,
}) => {
  const page = usePageStyles();
  const styles = useStyles();
  const { t } = useTranslation();
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleOpenAddDialog = () => {
    setIsCreating(true);
    setEditingAction({
      id: createId("action"),
      name: t("actions.newActionName"),
      type: category === "scriptCommands" ? "ahk" : "keys",
      value: "",
    });
  };

  const handleEditAction = (action: Action) => {
    setIsCreating(false);
    setEditingAction(action);
  };

  const handleSaveAction = (saved: Action) => {
    if (!onUpdateActions) {
      return;
    }
    onUpdateActions(
      isCreating
        ? [...actions, saved]
        : actions.map((action) => (action.id === saved.id ? saved : action)),
    );
    setEditingAction(null);
    setIsCreating(false);
  };

  const handleDeleteAction = (id: string) => {
    onUpdateActions?.(actions.filter((action) => action.id !== id));
  };

  return (
    <div className={page.container}>
      <PageHeader title={t(`nav.${category}`)} />

      <Card className={page.card}>
        <table className={page.table}>
          <thead>
            <tr>
              <th className={page.th}>{t("actions.tableName")}</th>
              <th className={page.th}>{t("actions.tableAction")}</th>
              <th className={page.th} style={{ width: "48px" }}></th>
            </tr>
          </thead>
          <tbody>
            {actions.filter((action) => getCommandCategory(action) === category).map((action) => (
              <tr
                key={action.id}
                className={`${page.row} ${page.clickableRow}`}
                onClick={() => handleEditAction(action)}
                title={t("targets.doubleClickActionTip")}
              >
                <td className={styles.tdName}>{formatActionName(t, action)}</td>
                <td className={styles.tdAction}>
                  <span className={styles.codeValue}>
                    {action.value || t("actions.emptyValue")}
                  </span>
                </td>
                <td className={page.opsCell}>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Delete16Regular />}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteAction(action.id);
                    }}
                    title={t("actions.deleteTip")}
                  />
                </td>
              </tr>
            ))}
            {!actions.some((action) => getCommandCategory(action) === category) && (
              <tr>
                <td colSpan={3} className={page.emptyCell}>
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
        <EditCommandDialog
          open={!!editingAction}
          action={editingAction}
          category={category}
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
