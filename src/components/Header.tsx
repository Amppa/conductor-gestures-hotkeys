import React from "react";
import { useTranslation } from "react-i18next";
import {
  makeStyles,
  tokens,
  Badge,
  Button,
  Subtitle1,
} from "@fluentui/react-components";
import {
  Play16Regular,
  Pause16Regular,
  ArrowClockwise16Regular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    height: "56px",
    minHeight: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
});

interface HeaderProps {
  title: string;
  isPaused: boolean;
  statusMsg?: string;
  onTogglePause: () => void;
  onReload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  isPaused,
  statusMsg,
  onTogglePause,
  onReload,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <header className={styles.container}>
      <div className={styles.left}>
        <Subtitle1>{title}</Subtitle1>
        <Badge
          appearance="tint"
          color={isPaused ? "warning" : "success"}
          shape="rounded"
        >
          {isPaused ? t("app.enginePaused") : statusMsg || t("app.engineRunning")}
        </Badge>
      </div>

      <div className={styles.right}>
        <Button
          size="small"
          appearance="secondary"
          icon={isPaused ? <Play16Regular /> : <Pause16Regular />}
          onClick={onTogglePause}
        >
          {isPaused ? t("header.resume") : t("header.pause")}
        </Button>
        <Button
          size="small"
          appearance="primary"
          icon={<ArrowClockwise16Regular />}
          onClick={onReload}
        >
          {t("header.apply")}
        </Button>
      </div>
    </header>
  );
};
