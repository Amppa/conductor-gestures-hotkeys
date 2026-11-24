import React, { useState } from "react";
import { Button, Card, makeStyles, tokens } from "@fluentui/react-components";
import { Add16Regular, Delete16Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { EditHotkeyDialog } from "./EditHotkeyDialog";
import { Gesture } from "../../domain/types";
import { formatHotkeyTrigger } from "./hotkeyTrigger";
import { PageHeader, usePageStyles } from "../../shared/pageStyles";
import { createId } from "../../shared/ids";

const useStyles = makeStyles({
  tdName: {
    padding: "8px 12px",
    fontWeight: tokens.fontWeightSemibold,
  },
  tdKey: {
    padding: "8px 12px",
    color: tokens.colorBrandForeground1,
    fontFamily: tokens.fontFamilyMonospace,
  },
});

interface HotkeysViewProps {
  hotkeys: Gesture[];
  onUpdateHotkeys: (hotkeys: Gesture[]) => void;
}

export const HotkeysView: React.FC<HotkeysViewProps> = ({
  hotkeys,
  onUpdateHotkeys,
}) => {
  const page = usePageStyles();
  const styles = useStyles();
  const { t } = useTranslation();
  const [editingHotkey, setEditingHotkey] = useState<Gesture | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleAdd = () => {
    setIsCreating(true);
    setEditingHotkey({
      id: createId("hotkey"),
      name: "",
      trigger: "",
      steps: [],
    });
  };

  const handleEdit = (hotkey: Gesture) => {
    setIsCreating(false);
    setEditingHotkey({ ...hotkey, steps: [...hotkey.steps] });
  };

  const handleSave = (hotkey: Gesture) => {
    onUpdateHotkeys(
      isCreating
        ? [...hotkeys, hotkey]
        : hotkeys.map((item) => (item.id === hotkey.id ? hotkey : item)),
    );
    setEditingHotkey(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    onUpdateHotkeys(hotkeys.filter((hotkey) => hotkey.id !== id));
  };

  const handleCancel = () => {
    setEditingHotkey(null);
    setIsCreating(false);
  };

  return (
    <div className={page.container}>
      <PageHeader
        title={t("nav.hotkeys")}
        description={t("hotkeys.description")}
      />

      <Card className={page.card}>
        <table className={page.table}>
          <thead>
            <tr>
              <th className={page.th}>{t("hotkeys.tableName")}</th>
              <th className={page.th}>{t("hotkeys.tableKey")}</th>
              <th className={page.th}></th>
            </tr>
          </thead>
          <tbody>
            {hotkeys.map((hotkey) => (
              <tr
                key={hotkey.id}
                className={`${page.row} ${page.clickableRow}`}
                onClick={() => handleEdit(hotkey)}
                title={t("hotkeys.editTip")}
              >
                <td className={styles.tdName}>{hotkey.name}</td>
                <td className={styles.tdKey}>{formatHotkeyTrigger(hotkey.trigger)}</td>
                <td className={page.opsCell}>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Delete16Regular />}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(hotkey.id);
                    }}
                    title={t("hotkeys.deleteTip")}
                  />
                </td>
              </tr>
            ))}
            {hotkeys.length === 0 && (
              <tr>
                <td colSpan={3} className={page.emptyCell}>
                  {t("hotkeys.empty")}
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
            onClick={handleAdd}
          >
            {t("hotkeys.add")}
          </Button>
        </div>
      </Card>

      {editingHotkey && (
        <EditHotkeyDialog
          hotkey={editingHotkey}
          existingHotkeys={hotkeys}
          isCreating={isCreating}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};
