import React from "react";
import {
  makeStyles,
  tokens,
  Card,
  Subtitle2,
  Caption1,
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import { AppConfig } from "../types";

const useStyles = makeStyles({
  container: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    overflowY: "auto",
    height: "calc(100% - 48px)",
  },
  card: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
});

interface BackupViewProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
}

export const BackupView: React.FC<BackupViewProps> = () => {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <div>
        <Subtitle2>{t("backup.title", { defaultValue: "設定匯入與匯出" })}</Subtitle2>
        <div>
          <Caption1>
            {t("backup.subtitle", {
              defaultValue: "備份目前所有手勢與目標設定、匯入既有設定檔，或將設定恢復至原廠預設狀態。",
            })}
          </Caption1>
        </div>
      </div>

      <Card className={styles.card}>
        <Caption1>
          {t("backup.placeholder", { defaultValue: "匯入匯出功能骨架建置中..." })}
        </Caption1>
      </Card>
    </div>
  );
};
