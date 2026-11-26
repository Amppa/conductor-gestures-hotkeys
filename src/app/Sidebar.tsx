import React from "react";
import { MouseWirelessIcon } from "../shared/icons/MouseWirelessIcon";
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
  Desktop24Regular,
  Keyboard24Regular,
  Flash24Regular,
  List24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";

export type NavTabId =
  | "targets"
  | "excluded"
  | "gestures"
  | "mouseButtons"
  | "screen"
  | "hotkeys"
  | "actions"
  | "popup-menu"
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
            {t("nav.targets")}
          </Tab>
          <Tab value="excluded" icon={<Prohibited24Regular />}>
            {t("nav.excluded")}
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
            {t("nav.gestures")}
          </Tab>
          <Tab value="mouseButtons" icon={<MouseWirelessIcon />}>
            {t("nav.mouseButtons")}
          </Tab>
          <Tab value="screen" icon={<Desktop24Regular />}>
            {t("nav.screen")}
          </Tab>
          <Tab value="hotkeys" icon={<Keyboard24Regular />}>
            {t("nav.hotkeys")}
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
            {t("nav.actions")}
          </Tab>
          <Tab value="popup-menu" icon={<List24Regular />}>
            {t("nav.popupMenu")}
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
          <Tab value="settings" icon={<Settings24Regular />}>
            {t("nav.settings")}
          </Tab>
        </TabList>
      </div>
    </aside>
  );
};
