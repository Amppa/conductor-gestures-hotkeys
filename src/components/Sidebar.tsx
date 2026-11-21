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
  Prohibited24Regular,
  HandDraw24Regular,
  Keyboard24Regular,
  Flash24Regular,
  Settings24Regular,
  ArrowDownload24Regular,
} from "@fluentui/react-icons";

export type NavTabId =
  | "targets"
  | "excluded"
  | "gestures"
  | "hotkeys"
  | "actions"
  | "backup"
  | "settings";

const useStyles = makeStyles({
  container: {
    width: "170px",
    minWidth: "170px",
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    flexDirection: "column",
    padding: "16px 8px",
    userSelect: "none",
    boxSizing: "border-box",
  },
  header: {
    padding: "4px 8px 12px 8px",
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontWeight: 600,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    marginTop: "2px",
  },
  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  tabList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  bottomSection: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  divider: {
    margin: "8px 0",
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

      <div className={styles.navSection}>
        {/* 1. Targets & Excluded */}
        <TabList
          vertical
          selectedValue={selectedTab}
          onTabSelect={(_, data) => onTabSelect(data.value as NavTabId)}
          className={styles.tabList}
        >
          <Tab value="targets" icon={<Apps24Regular />}>
            {t("nav.targets", { defaultValue: "應用範圍" })}
          </Tab>
          <Tab value="excluded" icon={<Prohibited24Regular />}>
            {t("nav.excluded", { defaultValue: "排除程式" })}
          </Tab>
        </TabList>

        <Divider className={styles.divider} />

        {/* 2. Gestures & Hotkeys */}
        <TabList
          vertical
          selectedValue={selectedTab}
          onTabSelect={(_, data) => onTabSelect(data.value as NavTabId)}
          className={styles.tabList}
        >
          <Tab value="gestures" icon={<HandDraw24Regular />}>
            {t("nav.gestures", { defaultValue: "觸發手勢" })}
          </Tab>
          <Tab value="hotkeys" icon={<Keyboard24Regular />}>
            {t("nav.hotkeys", { defaultValue: "觸發熱鍵" })}
          </Tab>
        </TabList>

        <Divider className={styles.divider} />

        {/* 3. Actions / Behaviors */}
        <TabList
          vertical
          selectedValue={selectedTab}
          onTabSelect={(_, data) => onTabSelect(data.value as NavTabId)}
          className={styles.tabList}
        >
          <Tab value="actions" icon={<Flash24Regular />}>
            {t("nav.actions", { defaultValue: "執行指令" })}
          </Tab>
        </TabList>
      </div>

      {/* 4. Bottom settings section */}
      <div className={styles.bottomSection}>
        <Divider className={styles.divider} />
        <TabList
          vertical
          selectedValue={selectedTab}
          onTabSelect={(_, data) => onTabSelect(data.value as NavTabId)}
          className={styles.tabList}
        >
          <Tab value="backup" icon={<ArrowDownload24Regular />}>
            {t("nav.backup", { defaultValue: "匯入匯出" })}
          </Tab>
          <Tab value="settings" icon={<Settings24Regular />}>
            {t("nav.settings", { defaultValue: "設定" })}
          </Tab>
        </TabList>
      </div>
    </aside>
  );
};
