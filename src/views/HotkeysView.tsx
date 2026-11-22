import React, { useState } from "react";
import {
  Button,
  Card,
  Divider,
  makeStyles,
  tokens,
  Title3,
} from "@fluentui/react-components";
import { Add16Regular, Delete16Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { EditHotkeyDialog } from "../components/EditHotkeyDialog";
import { Gesture } from "../types";
import { formatHotkeyTrigger } from "../utils/hotkeyTrigger";

const useStyles = makeStyles({
  container: {
    padding: "16px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minHeight: "100%",
    boxSizing: "border-box",
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
  description: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
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
    fontWeight: tokens.fontWeightSemibold,
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
    fontWeight: tokens.fontWeightSemibold,
  },
  tdKey: {
    padding: "8px 12px",
    color: tokens.colorBrandForeground1,
    fontFamily: tokens.fontFamilyMonospace,
  },
  tdOps: {
    width: "48px",
    padding: "6px 8px",
    textAlign: "right",
  },
  empty: {
    padding: "16px",
    textAlign: "center",
    color: tokens.colorNeutralForeground4,
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
  const styles = useStyles();
  const { t } = useTranslation();
  const [editingHotkey, setEditingHotkey] = useState<Gesture | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleAdd = () => {
    setIsCreating(true);
    setEditingHotkey({
      id: `hotkey-${Date.now()}`,
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
    if (isCreating) {
      onUpdateHotkeys([...hotkeys, hotkey]);
    } else {
      onUpdateHotkeys(
        hotkeys.map((item) => (item.id === hotkey.id ? hotkey : item))
      );
    }
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
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <Title3 as="h1" className={styles.pageTitle}>
          {t("nav.hotkeys")}
        </Title3>
        <Divider className={styles.divider} />
        <div className={styles.description}>{t("hotkeys.description")}</div>
      </div>

      <Card className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>{t("hotkeys.tableName")}</th>
              <th className={styles.th}>{t("hotkeys.tableKey")}</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {hotkeys.map((hotkey) => (
              <tr
                key={hotkey.id}
                className={styles.tr}
                onClick={() => handleEdit(hotkey)}
                title={t("hotkeys.editTip")}
              >
                <td className={styles.tdName}>{hotkey.name}</td>
                <td className={styles.tdKey}>
                  {formatHotkeyTrigger(hotkey.trigger)}
                </td>
                <td className={styles.tdOps}>
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
                <td colSpan={3} className={styles.empty}>
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
