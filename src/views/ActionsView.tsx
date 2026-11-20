import React from "react";
import { useTranslation } from "react-i18next";
import {
  makeStyles,
  tokens,
  Card,
  Subtitle2,
  Caption1,
  Badge,
} from "@fluentui/react-components";
import { Action } from "../types";

const useStyles = makeStyles({
  container: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflowY: "auto",
    height: "calc(100% - 48px)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  card: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeValue: {
    fontFamily: "Consolas, 'Cascadia Code', monospace",
    fontSize: tokens.fontSizeBase200,
    padding: "4px 8px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    wordBreak: "break-all",
  },
});

interface ActionsViewProps {
  actions: Action[];
}

export const ActionsView: React.FC<ActionsViewProps> = ({ actions }) => {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <div>
        <Subtitle2>{t("actions.title")}</Subtitle2>
        <div>
          <Caption1>{t("actions.subtitle")}</Caption1>
        </div>
      </div>

      <div className={styles.grid}>
        {actions.map((act) => (
          <Card key={act.id} className={styles.card}>
            <div className={styles.header}>
              <span style={{ fontWeight: 600 }}>{t("actionNames." + act.id, { defaultValue: act.name })}</span>
              <Badge appearance="tint" color="informative">
                {act.type}
              </Badge>
            </div>
            <div>
              <Caption1>{t("actions.executionContent")}</Caption1>
              <div className={styles.codeValue}>{act.value}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
