import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  Subtitle2,
  Tag,
  Button,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Add16Regular } from "@fluentui/react-icons";
import { Target } from "../../domain/types";
import { addExecutable, removeExecutable } from "../../domain/targetMutations";
import { AddProcessDialog } from "./AddProcessDialog";
import { PageHeader, usePageStyles } from "../../shared/pageStyles";

const DISABLED_TARGET_ID = "disabled";

const useStyles = makeStyles({
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
  const page = usePageStyles();
  const styles = useStyles();
  const { t } = useTranslation();
  const [isAddProcessOpen, setIsAddProcessOpen] = useState(false);

  const disabledTarget: Target = targets.find(
    (target) => target.kind === "disabled",
  ) ?? {
    id: DISABLED_TARGET_ID,
    name: t("targets.excludedApps"),
    kind: "disabled",
    enabled: true,
    executables: [],
    bindings: [],
  };

  const handleAddExe = (processName: string) => {
    const executable = processName.trim().toLowerCase();
    if (!executable) {
      return;
    }
    const exists = targets.some((target) => target.id === disabledTarget.id);
    onUpdateTargets(
      exists
        ? addExecutable(targets, disabledTarget.id, executable)
        : [...targets, { ...disabledTarget, executables: [executable] }],
    );
    setIsAddProcessOpen(false);
  };

  const handleDeleteExe = (executable: string) => {
    onUpdateTargets(
      removeExecutable(targets, disabledTarget.id, executable),
    );
  };

  return (
    <div className={page.container}>
      <PageHeader title={t("nav.excluded")} />

      <div className={styles.hintBanner}>{t("targets.disabledDesc")}</div>

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
          {disabledTarget.executables.map((executable) => (
            <Tag
              key={executable}
              size="medium"
              dismissible
              dismissIcon={{ "aria-label": "remove" }}
              onClick={() => handleDeleteExe(executable)}
            >
              {executable}
            </Tag>
          ))}
          {disabledTarget.executables.length === 0 && (
            <span className={styles.emptyText}>{t("targets.noExcludedApps")}</span>
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
