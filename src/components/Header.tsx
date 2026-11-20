import React from "react";
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

  return (
    <header className={styles.container}>
      <div className={styles.left}>
        <Subtitle1>{title}</Subtitle1>
        <Badge
          appearance="tint"
          color={isPaused ? "warning" : "success"}
          shape="rounded"
        >
          {isPaused ? "手勢已暫停" : statusMsg || "手勢引擎運作中"}
        </Badge>
      </div>

      <div className={styles.right}>
        <Button
          size="small"
          appearance="secondary"
          icon={isPaused ? <Play16Regular /> : <Pause16Regular />}
          onClick={onTogglePause}
        >
          {isPaused ? "繼續手勢" : "暫停手勢"}
        </Button>
        <Button
          size="small"
          appearance="primary"
          icon={<ArrowClockwise16Regular />}
          onClick={onReload}
        >
          套用並重載
        </Button>
      </div>
    </header>
  );
};
