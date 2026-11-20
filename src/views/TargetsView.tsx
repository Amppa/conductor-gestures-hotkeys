import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  makeStyles,
  tokens,
  Card,
  Subtitle2,
  Caption1,
  Badge,
  Button,
  Checkbox,
  Tag,
  Divider,
} from "@fluentui/react-components";
import {
  Add16Regular,
  Delete16Regular,
  ChevronDown16Regular,
  ChevronRight16Regular,
} from "@fluentui/react-icons";
import { Target, Binding, Gesture, Action } from "../types";
import { formatGestureLabel } from "../utils/gestureSymbols";
import { EditGestureDialog } from "../components/EditGestureDialog";
import { EditActionDialog } from "../components/EditActionDialog";
import { AddProcessDialog } from "../components/AddProcessDialog";

const useStyles = makeStyles({
  container: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    overflowY: "auto",
    height: "calc(100% - 48px)",
  },
  ruleHint: {
    padding: "8px 14px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    fontWeight: 500,
    width: "fit-content",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  card: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
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
  tr: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  tdCheckbox: {
    width: "40px",
    padding: "6px 8px",
  },
  tdGesture: {
    padding: "8px 12px",
    fontWeight: 600,
    cursor: "pointer",
    userSelect: "none",
  },
  tdAction: {
    padding: "8px 12px",
    cursor: "pointer",
    userSelect: "none",
    color: tokens.colorBrandForeground1,
  },
  tdOps: {
    width: "48px",
    textAlign: "right",
    padding: "6px 8px",
  },
  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },
});

interface TargetsViewProps {
  targets: Target[];
  onUpdateTargets: (updated: Target[]) => void;
  onDoubleGestureClick?: (targetId: string, bindingId: string) => void;
  onDoubleActionClick?: (targetId: string, bindingId: string) => void;
  onOpenAddProcessDialog?: (targetId: string) => void;
}

export const TargetsView: React.FC<TargetsViewProps> = ({
  targets,
  onUpdateTargets,
  onOpenAddProcessDialog,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Dialog states for inline double-click editing
  const [editingGesture, setEditingGesture] = useState<{ targetId: string; binding: Binding } | null>(null);
  const [editingAction, setEditingAction] = useState<{ targetId: string; binding: Binding } | null>(null);
  const [addProcessTargetId, setAddProcessTargetId] = useState<string | null>(null);

  const toggleGroupCollapse = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDoubleGesture = (targetId: string, bindingId: string) => {
    const t = targets.find((item) => item.id === targetId);
    if (!t) return;
    const b = t.bindings.find((item) => item.id === bindingId);
    if (!b) return;
    setEditingGesture({ targetId, binding: b });
  };

  const handleDoubleAction = (targetId: string, bindingId: string) => {
    const t = targets.find((item) => item.id === targetId);
    if (!t) return;
    const b = t.bindings.find((item) => item.id === bindingId);
    if (!b) return;
    setEditingAction({ targetId, binding: b });
  };

  const handleSaveGesture = (updatedGesture: Gesture) => {
    if (!editingGesture) return;
    const { targetId, binding } = editingGesture;
    const updated = targets.map((t) => {
      if (t.id !== targetId) return t;
      return {
        ...t,
        bindings: t.bindings.map((b) => (b.id === binding.id ? { ...b, gesture: updatedGesture } : b)),
      };
    });
    onUpdateTargets(updated);
    setEditingGesture(null);
  };

  const handleSaveAction = (updatedAction: Action) => {
    if (!editingAction) return;
    const { targetId, binding } = editingAction;
    const updated = targets.map((t) => {
      if (t.id !== targetId) return t;
      return {
        ...t,
        bindings: t.bindings.map((b) => (b.id === binding.id ? { ...b, action: updatedAction } : b)),
      };
    });
    onUpdateTargets(updated);
    setEditingAction(null);
  };

  const globalTarget = targets.find((t) => t.kind === "global");
  const specificGroups = targets.filter((t) => t.kind === "group");
  const disabledTarget = targets.find((t) => t.kind === "disabled");

  // Toggle binding enable/disable checkbox
  const handleToggleBinding = (targetId: string, bindingId: string, checked: boolean) => {
    const updated = targets.map((t) => {
      if (t.id !== targetId) return t;
      return {
        ...t,
        bindings: t.bindings.map((b) => (b.id === bindingId ? { ...b, enabled: checked } : b)),
      };
    });
    onUpdateTargets(updated);
  };

  // Delete a binding from a target
  const handleDeleteBinding = (targetId: string, bindingId: string) => {
    const updated = targets.map((t) => {
      if (t.id !== targetId) return t;
      return {
        ...t,
        bindings: t.bindings.filter((b) => b.id !== bindingId),
      };
    });
    onUpdateTargets(updated);
  };

  const handleAddProcessExe = (exe: string) => {
    if (!addProcessTargetId) return;
    const clean = exe.trim().toLowerCase();
    const updated = targets.map((t) => {
      if (t.id !== addProcessTargetId) return t;
      if (t.executables.map((e) => e.toLowerCase()).includes(clean)) {
        return t; // already present
      }
      return {
        ...t,
        executables: [...t.executables, clean],
      };
    });
    onUpdateTargets(updated);
  };

  const handleDeleteExe = (targetId: string, exe: string) => {
    const updated = targets.map((t) => {
      if (t.id !== targetId) return t;
      return {
        ...t,
        executables: t.executables.filter((e) => e.toLowerCase() !== exe.toLowerCase()),
      };
    });
    onUpdateTargets(updated);
  };

  // Add a new specific group
  const handleAddGroup = () => {
    const newGroupId = `group-${Date.now()}`;
    const newGroup: Target = {
      id: newGroupId,
      name: t("targets.newGroupName"),
      enabled: true,
      kind: "group",
      executables: ["example.exe"],
      bindings: [],
    };
    onUpdateTargets([...targets, newGroup]);
  };

  // Delete a specific group
  const handleDeleteGroup = (groupId: string) => {
    onUpdateTargets(targets.filter((t) => t.id !== groupId));
  };

  // Render a clean [ ] Checkbox | Gesture | Action table
  const renderBindingsTable = (target: Target) => {
    return (
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}></th>
            <th className={styles.th}>{t("targets.tableGesture")}</th>
            <th className={styles.th}>{t("targets.tableAction")}</th>
            <th className={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {target.bindings.map((b) => (
            <tr key={b.id} className={styles.tr}>
              <td className={styles.tdCheckbox}>
                <Checkbox
                  checked={b.enabled}
                  onChange={(_, data) => handleToggleBinding(target.id, b.id, !!data.checked)}
                />
              </td>
              <td
                className={styles.tdGesture}
                onDoubleClick={() => handleDoubleGesture(target.id, b.id)}
                title={t("targets.doubleClickGestureTip")}
              >
                {formatGestureLabel(b.gesture.trigger, b.gesture.steps, t)}
              </td>
              <td
                className={styles.tdAction}
                onDoubleClick={() => handleDoubleAction(target.id, b.id)}
                title={t("targets.doubleClickActionTip")}
              >
                {t("actionNames." + b.action.id, { defaultValue: b.action.name })} ({b.action.value})
              </td>
              <td className={styles.tdOps}>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Delete16Regular />}
                  onClick={() => handleDeleteBinding(target.id, b.id)}
                  title={t("targets.deleteGestureTip")}
                />
              </td>
            </tr>
          ))}
          {target.bindings.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: "16px", textAlign: "center", color: tokens.colorNeutralForeground4 }}>
                {t("targets.emptyBindings")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div className={styles.container}>
      {/* Top clean logic prompt */}
      <div className={styles.ruleHint}>{t("targets.ruleHint")}</div>

      {/* 1. Global Default */}
      {globalTarget && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Subtitle2>{t("targets.globalTitle", { defaultValue: globalTarget.name })}</Subtitle2>
              <Badge appearance="tint" color="brand">
                {t("targets.globalBadge")}
              </Badge>
            </div>
            <Button
              size="small"
              appearance="secondary"
              icon={<Add16Regular />}
              onClick={() => {
                const newBinding: Binding = {
                  id: `b-${Date.now()}`,
                  enabled: true,
                  gesture: { id: `g-${Date.now()}`, name: t("targets.newGestureName"), trigger: "R", steps: ["R"] },
                  action: { id: `a-${Date.now()}`, name: t("targets.newActionName"), type: "keys", value: "^c" },
                };
                const updated = targets.map((t) =>
                  t.id === globalTarget.id ? { ...t, bindings: [...t.bindings, newBinding] } : t
                );
                onUpdateTargets(updated);
              }}
            >
              {t("targets.addGesture")}
            </Button>
          </div>
          <Card className={styles.card}>{renderBindingsTable(globalTarget)}</Card>
        </div>
      )}

      <Divider />

      {/* 2. Whitelist (App groups) */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <Subtitle2>{t("targets.specificSection")}</Subtitle2>
            <Caption1 style={{ display: "block", color: tokens.colorNeutralForeground3 }}>
              {t("targets.whitelistDesc")}
            </Caption1>
          </div>
          <Button size="small" appearance="secondary" icon={<Add16Regular />} onClick={handleAddGroup}>
            {t("targets.addGroup")}
          </Button>
        </div>

        {specificGroups.map((group) => {
          const isCollapsed = collapsedGroups[group.id];
          return (
            <Card key={group.id} className={styles.card}>
              <div className={styles.groupHeader}>
                <div className={styles.groupTitleArea} onClick={() => toggleGroupCollapse(group.id)}>
                  {isCollapsed ? <ChevronRight16Regular /> : <ChevronDown16Regular />}
                  <span style={{ fontWeight: 600 }}>{t("targets." + group.id + "Title", { defaultValue: group.name })}</span>
                  <Badge appearance="tint" color="informative">
                    {t("targets.appCount", { count: group.executables.length })}
                  </Badge>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Delete16Regular />}
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    {t("targets.deleteGroup")}
                  </Button>
                </div>
              </div>

              {!isCollapsed && (
                <>
                  <div>
                    <Caption1 style={{ marginBottom: "6px", display: "block" }}>{t("targets.includedApps")}</Caption1>
                    <div className={styles.tagList}>
                      {group.executables.map((exe) => (
                        <Tag
                          key={exe}
                          size="small"
                          dismissible
                          dismissIcon={{ "aria-label": "remove" }}
                          onClick={() => handleDeleteExe(group.id, exe)}
                        >
                          {exe}
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
                  </div>

                  <Divider />

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <Caption1 style={{ fontWeight: 600 }}>{t("targets.groupGestures")}</Caption1>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Add16Regular />}
                        onClick={() => {
                          const newBinding: Binding = {
                            id: `b-${Date.now()}`,
                            enabled: true,
                            gesture: { id: `g-${Date.now()}`, name: t("targets.newGestureName"), trigger: "R", steps: ["D"] },
                            action: { id: `a-${Date.now()}`, name: t("targets.newActionName"), type: "keys", value: "^w" },
                          };
                          const updated = targets.map((t) =>
                            t.id === group.id ? { ...t, bindings: [...t.bindings, newBinding] } : t
                          );
                          onUpdateTargets(updated);
                        }}
                      >
                        {t("targets.addGroupGesture")}
                      </Button>
                    </div>
                    {renderBindingsTable(group)}
                  </div>
                </>
              )}
            </Card>
          );
        })}
      </div>

      <Divider />

      {/* 3. Blocklist (Disabled apps) */}
      {disabledTarget && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <Subtitle2>{t("targets.disabledTitle", { defaultValue: disabledTarget.name })}</Subtitle2>
              <Caption1 style={{ display: "block", color: tokens.colorNeutralForeground3 }}>
                {t("targets.disabledDesc")}
              </Caption1>
            </div>
            <Button
              size="small"
              appearance="secondary"
              icon={<Add16Regular />}
              onClick={() => setAddProcessTargetId(disabledTarget.id)}
            >
              {t("targets.addDisabledApp")}
            </Button>
          </div>
          <Card className={styles.card}>
            <div className={styles.tagList}>
              {disabledTarget.executables.map((exe) => (
                <Tag
                  key={exe}
                  size="small"
                  dismissible
                  dismissIcon={{ "aria-label": "remove" }}
                  onClick={() => handleDeleteExe(disabledTarget.id, exe)}
                >
                  {exe}
                </Tag>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Inline Double-Click Edit Dialogs */}
      {editingGesture && (
        <EditGestureDialog
          open={!!editingGesture}
          gesture={editingGesture.binding.gesture}
          onSave={handleSaveGesture}
          onCancel={() => setEditingGesture(null)}
        />
      )}

      {editingAction && (
        <EditActionDialog
          open={!!editingAction}
          action={editingAction.binding.action}
          onSave={handleSaveAction}
          onCancel={() => setEditingAction(null)}
        />
      )}

      {addProcessTargetId && (
        <AddProcessDialog
          open={!!addProcessTargetId}
          targetName={
            t("targets." + addProcessTargetId + "Title", {
              defaultValue: targets.find((t) => t.id === addProcessTargetId)?.name || "Target List",
            })
          }
          onAdd={handleAddProcessExe}
          onCancel={() => setAddProcessTargetId(null)}
        />
      )}
    </div>
  );
};
