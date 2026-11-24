import React from "react";
import {
  Divider,
  makeStyles,
  Title3,
  tokens,
} from "@fluentui/react-components";

/**
 * Shared page shell and table styles used by every top-level view.
 */
export const usePageStyles = makeStyles({
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
    fontWeight: 600,
  },
  row: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    transition: "background-color 0.15s ease",
  },
  clickableRow: {
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
  opsCell: {
    width: "48px",
    textAlign: "right",
    padding: "6px 8px",
  },
  emptyCell: {
    padding: "16px",
    textAlign: "center",
    color: tokens.colorNeutralForeground4,
  },
});

interface PageHeaderProps {
  title: string;
  description?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  const styles = usePageStyles();

  return (
    <div className={styles.pageHeader}>
      <Title3 as="h1" className={styles.pageTitle}>
        {title}
      </Title3>
      <Divider className={styles.divider} />
      {description && <div className={styles.description}>{description}</div>}
    </div>
  );
};
