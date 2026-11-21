import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Title3,
  Divider,
  Card,
  Subtitle2,
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
  hintBanner: {
    padding: "8px 14px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    width: "fit-content",
  },
  card: {
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
    minHeight: "32px",
  },
  emptyText: {
    color: tokens.colorNeutralForeground4,
    fontSize: tokens.fontSizeBase200,
    fontStyle: "italic",
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
    name: t("targets.excludedApps"),
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
      <div className={styles.pageHeader}>
        <Title3 as="h1" className={styles.pageTitle}>{t("nav.excluded")}</Title3>
        <Divider className={styles.divider} />
      </div>

      <div className={styles.hintBanner}>
        {t("targets.disabledDesc")}
      </div>

      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <Subtitle2>{t("targets.excludedApps")}</Subtitle2>
          <Button
            size="small"
            appearance="secondary"
            icon={<Add16Regular />}
            onClick={() => setIsAddProcessOpen(true)}
          >
            {t("targets.addApp")}
          </Button>
        </div>

        <div className={styles.tagList}>
          {disabledTarget.executables.map((exe) => (
            <Tag
              key={exe}
              size="medium"
              dismissible
              dismissIcon={{ "aria-label": "remove" }}
              onClick={() => handleDeleteExe(exe)}
            >
              {exe}
            </Tag>
          ))}
          {disabledTarget.executables.length === 0 && (
            <span className={styles.emptyText}>
              {t("targets.noExcludedApps")}
            </span>
          )}
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
