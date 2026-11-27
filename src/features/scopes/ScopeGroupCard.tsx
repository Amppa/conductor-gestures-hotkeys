import type { ReactNode } from "react";
import { makeStyles, tokens, Card, Tooltip, Caption1, Button, Input, Tag } from "@fluentui/react-components";
import { Add16Regular, Delete16Regular, ChevronDown16Regular, ChevronRight16Regular, Edit16Regular, Checkmark16Regular, Dismiss16Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import type { Target } from "../../domain/types";
import type { useRuleDragDrop } from "./useRuleDragDrop";
import { usePageStyles } from "../../shared/pageStyles";
import { formatScopeName } from "../../shared/displayNames";

const useStyles = makeStyles({
  groupHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    userSelect: "none",
  },
  groupTitleArea: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },

});

interface GroupRenameControls {
  editingId: string | null;
  draft: string;
  onStart: (groupId: string, name: string) => void;
  onChange: (name: string) => void;
  onSave: (groupId: string) => void;
  onCancel: () => void;
}

interface ScopeGroupCardProps {
  group: Target;
  isCollapsed: boolean;
  isDropTarget: boolean;
  dropProps: ReturnType<ReturnType<typeof useRuleDragDrop>["scopeDropProps"]>;
  rename: GroupRenameControls;
  onToggleCollapse: (groupId: string) => void;
  onDelete: (groupId: string) => void;
  onDeleteExecutable: (groupId: string, executable: string) => void;
  onAddProcess: (groupId: string) => void;
  onAddRule: () => void;
  children: ReactNode;
}

export function ScopeGroupCard({
  group, isCollapsed, isDropTarget, dropProps, rename, children,
  onToggleCollapse: toggleGroupCollapse, onDelete: setPendingDeleteGroupId,
  onDeleteExecutable: handleDeleteExe, onAddProcess: setAddProcessTargetId, onAddRule,
}: ScopeGroupCardProps) {
  const { t } = useTranslation();
  const page = usePageStyles();
  const styles = useStyles();
  const {
    editingId: editingGroupId, draft: tempGroupName,
    onStart: handleStartRename, onChange: setTempGroupName,
    onSave: handleSaveRename, onCancel: handleCancelRename,
  } = rename;
  const groupDisplayName = formatScopeName(t, group);
  return (
            <Tooltip content={t("targets.moveTo", { name: groupDisplayName })} relationship="description" visible={isDropTarget}>
            <Card className={page.card} {...dropProps}>
              <div className={styles.groupHeader}>
                <div
                  className={styles.groupTitleArea}
                  onClick={() => !editingGroupId && toggleGroupCollapse(group.id)}
                >
                  {isCollapsed ? <ChevronRight16Regular /> : <ChevronDown16Regular />}
                  {editingGroupId === group.id ? (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "4px" }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Input
                        size="small"
                        value={tempGroupName}
                        autoFocus
                        placeholder={t("targets.renameGroupPlaceholder")}
                        onChange={(_, data) => setTempGroupName(data.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleSaveRename(group.id);
                          } else if (event.key === "Escape") {
                            handleCancelRename();
                          }
                        }}
                      />
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Checkmark16Regular />}
                        onClick={() => handleSaveRename(group.id)}
                      />
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Dismiss16Regular />}
                        onClick={handleCancelRename}
                      />
                    </div>
                  ) : (
                    <>
                      <span
                        style={{ fontWeight: 600, cursor: "pointer" }}
                        title={t("targets.renameGroupTip")}
                        onDoubleClick={(event) => {
                          event.stopPropagation();
                          handleStartRename(group.id, groupDisplayName);
                        }}
                      >
                        {groupDisplayName}
                      </span>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Edit16Regular />}
                        title={t("targets.renameGroupTip")}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStartRename(group.id, groupDisplayName);
                        }}
                      />
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Delete16Regular />}
                        title={t("targets.deleteGroup")}
                        aria-label={t("targets.deleteGroup")}
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingDeleteGroupId(group.id);
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              {!isCollapsed && (
                <>
                  <div className={styles.tagList}>
                    <Caption1
                      style={{
                        color: tokens.colorNeutralForeground3,
                        fontWeight: 600,
                      }}
                    >
                      {t("targets.includedApps")}
                    </Caption1>
                    {group.executables.map((executable) => (
                      <Tag
                        key={executable}
                        size="small"
                        dismissible
                        dismissIcon={{ "aria-label": "remove" }}
                        onClick={() => handleDeleteExe(group.id, executable)}
                      >
                        {executable}
                      </Tag>
                    ))}
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<Add16Regular />}
                      onClick={() => setAddProcessTargetId(group.id)}
                    >
                      {t("targets.addApp")}
                    </Button>
                  </div>

                  <div style={{ marginTop: "4px" }}>
                    {children}
                  </div>

                  <div>
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<Add16Regular />}
                      onClick={onAddRule}
                    >
                      {t("targets.addGesture")}
                    </Button>
                  </div>
                </>
              )}
            </Card>
            </Tooltip>
  );
}
