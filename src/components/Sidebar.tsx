import React from "react";
import { useTranslation } from "react-i18next";
import {
  TabList,
  Tab,
  Divider,
  makeStyles,
  tokens,
  Subtitle2,
  Caption1,
} from "@fluentui/react-components";
import {
  Apps24Regular,
  HandDraw24Regular,
  Flash24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";

export type NavTabId = "targets" | "gestures" | "actions" | "settings";

const useStyles = makeStyles({
  container: {
    width: "250px",
    minWidth: "250px",
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    flexDirection: "column",
    padding: "16px 12px",
    userSelect: "none",
  },
  header: {
    padding: "8px 12px 16px 12px",
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontWeight: 600,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    marginTop: "2px",
  },
  tabList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  bottomSection: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  divider: {
    margin: "12px 0",
  },
});

interface SidebarProps {
  selectedTab: NavTabId;
  onTabSelect: (tabId: NavTabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedTab,
  onTabSelect,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <aside className={styles.container}>
      <div className={styles.header}>
        <Subtitle2 className={styles.title}>{t("app.title")}</Subtitle2>
        <div className={styles.subtitle}>
          <Caption1>{t("app.subtitle")}</Caption1>
        </div>
      </div>

      {/* Main navigation list */}
      <TabList
        vertical
        selectedValue={selectedTab}
        onTabSelect={(_, data) => onTabSelect(data.value as NavTabId)}
        className={styles.tabList}
      >
        <Tab value="targets" icon={<Apps24Regular />}>
          {t("nav.targets")}
        </Tab>
        <Tab value="gestures" icon={<HandDraw24Regular />}>
          {t("nav.gestures")}
        </Tab>
        <Tab value="actions" icon={<Flash24Regular />}>
          {t("nav.actions")}
        </Tab>
      </TabList>

      {/* Bottom settings section */}
      <div className={styles.bottomSection}>
        <Divider className={styles.divider} />
        <TabList
          vertical
          selectedValue={selectedTab}
          onTabSelect={(_, data) => onTabSelect(data.value as NavTabId)}
          className={styles.tabList}
        >
          <Tab value="settings" icon={<Settings24Regular />}>
            {t("nav.settings")}
          </Tab>
        </TabList>
      </div>
    </aside>
  );
};
