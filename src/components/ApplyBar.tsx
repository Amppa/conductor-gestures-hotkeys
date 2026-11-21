import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Spinner,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Warning16Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    minHeight: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    padding: "0 24px",
    flexShrink: 0,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow8,
    position: "relative",
    zIndex: 1,
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  errorStatus: {
    color: tokens.colorStatusDangerForeground1,
  },
  statusText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  applyButton: {
    minWidth: "112px",
  },
});

interface ApplyBarProps {
  isDirty: boolean;
  isApplying: boolean;
  errorMsg: string | null;
  onDiscard: () => void;
  onApply: () => void;
}

export const ApplyBar: React.FC<ApplyBarProps> = ({
  isDirty,
  isApplying,
  errorMsg,
  onDiscard,
  onApply,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();

  if (!isDirty && !errorMsg) {
    return null;
  }

  return (
    <div className={styles.container} aria-live="polite">
      <div className={`${styles.status} ${errorMsg ? styles.errorStatus : ""}`}>
        {errorMsg && <Warning16Regular aria-hidden />}
        <span className={styles.statusText} title={errorMsg || undefined}>
          {errorMsg || t("applyBar.pendingChanges")}
        </span>
      </div>

      <div className={styles.actions}>
        {isDirty && (
          <Button
            appearance="secondary"
            disabled={isApplying}
            onClick={onDiscard}
          >
            {t("applyBar.discard")}
          </Button>
        )}
        <Button
          className={styles.applyButton}
          appearance="primary"
          disabled={isApplying}
          icon={isApplying ? <Spinner size="tiny" /> : undefined}
          onClick={onApply}
        >
          {isApplying
            ? t("applyBar.applying")
            : isDirty
            ? t("applyBar.apply")
            : t("applyBar.retry", { defaultValue: "重試啟動" })}
        </Button>
      </div>
    </div>
  );
};
