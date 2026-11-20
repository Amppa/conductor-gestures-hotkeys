import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  Caption1,
  Tag,
  Button,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Add16Regular } from "@fluentui/react-icons";
import { Target } from "../types";
import { AddProcessDialog } from "../components/AddProcessDialog";

const useStyles = makeStyles({
  container: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflowY: "auto",
    height: "calc(100% - 48px)",
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
  },
  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },
});

interface ExcludedViewProps {
  targets: Target[];
  onUpdateTargets: (targets: Target[]) => void;
}

export const ExcludedView: React.FC<ExcludedViewProps> = ({
  targets,
  onUpdateTargets,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const [isAddProcessOpen, setIsAddProcessOpen] = useState(false);

  // Find or create disabled target
  const disabledTarget = targets.find((t) => t.kind === "disabled") || {
    id: "target-disabled",
    name: "排除目標",
    kind: "disabled",
    enabled: true,
    executables: [],
    bindings: [],
  };

  const handleAddExe = (processName: string) => {
    const trimmed = processName.trim();
    if (!trimmed) return;
    const exists = targets.some((t) => t.id === disabledTarget.id);
    let updated: Target[];
    if (exists) {
      updated = targets.map((t) =>
        t.id === disabledTarget.id && !t.executables.includes(trimmed)
          ? { ...t, executables: [...t.executables, trimmed] }
          : t
      );
    } else {
      updated = [...targets, { ...disabledTarget, executables: [trimmed] }];
    }
    onUpdateTargets(updated);
    setIsAddProcessOpen(false);
  };

  const handleDeleteExe = (exeName: string) => {
    const updated = targets.map((t) =>
      t.id === disabledTarget.id
        ? { ...t, executables: t.executables.filter((e) => e !== exeName) }
        : t
    );
    onUpdateTargets(updated);
  };

  return (
    <div className={styles.container}>
      <Caption1 className={styles.subtitle}>
        {t("targets.disabledDesc", {
          defaultValue: "排除目標內的應用程式將完全放行原生點擊，手勢引擎不進行任何攔截。例如遊戲或特定設計軟體。",
        })}
      </Caption1>

      <Card className={styles.card}>
        <div className={styles.tagList}>
          <Caption1 style={{ color: tokens.colorNeutralForeground3, fontWeight: 600 }}>
            {t("targets.includedApps", { defaultValue: "包含之程式：" })}
          </Caption1>
          {disabledTarget.executables.map((exe) => (
            <Tag
              key={exe}
              size="small"
              dismissible
              dismissIcon={{ "aria-label": "remove" }}
              onClick={() => handleDeleteExe(exe)}
            >
              {exe}
            </Tag>
          ))}
          <Button
            size="small"
            appearance="subtle"
            icon={<Add16Regular />}
            onClick={() => setIsAddProcessOpen(true)}
          >
            {t("targets.addApp", { defaultValue: "新增程式" })}
          </Button>
        </div>
      </Card>

      <AddProcessDialog
        open={isAddProcessOpen}
        targetName={disabledTarget.name}
        onAdd={handleAddExe}
        onCancel={() => setIsAddProcessOpen(false)}
      />
    </div>
  );
};
