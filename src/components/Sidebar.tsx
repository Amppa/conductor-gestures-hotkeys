import React from "react";
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

  return (
    <aside className={styles.container}>
      <div className={styles.header}>
        <Subtitle2 className={styles.title}>MouseGesture 5Btn</Subtitle2>
        <div className={styles.subtitle}>
          <Caption1>滑鼠五鍵與手勢管理系統</Caption1>
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
          目標清單
        </Tab>
        <Tab value="gestures" icon={<HandDraw24Regular />}>
          手勢清單
        </Tab>
        <Tab value="actions" icon={<Flash24Regular />}>
          動作清單
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
            設定
          </Tab>
        </TabList>
      </div>
    </aside>
  );
};
