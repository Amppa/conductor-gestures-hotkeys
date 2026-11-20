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
  Input,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
} from "@fluentui/react-components";
import {
  Add16Regular,
  Delete16Regular,
  ChevronDown16Regular,
  ChevronRight16Regular,
  Edit16Regular,
  Checkmark16Regular,
  Dismiss16Regular,
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
    padding: "2px 4px",
    fontWeight: 600,
    userSelect: "none",
  },
  tdAction: {
    padding: "2px 4px",
    userSelect: "none",
    color: tokens.colorBrandForeground1,
  },
  cellTriggerArea: {
    padding: "6px 8px",
    cursor: "pointer",
    borderRadius: tokens.borderRadiusSmall,
    transition: "background-color 0.15s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "6px",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
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
  gestureTemplates?: Gesture[];
  actionTemplates?: Action[];
  onUpdateTargets: (updated: Target[]) => void;
  onAddGestureTemplate?: (newTemplate: Gesture) => void;
  onAddActionTemplate?: (newAction: Action) => void;
  onDoubleGestureClick?: (targetId: string, bindingId: string) => void;
  onDoubleActionClick?: (targetId: string, bindingId: string) => void;
  onOpenAddProcessDialog?: (targetId: string) => void;
}

export const TargetsView: React.FC<TargetsViewProps> = ({
  targets,
  gestureTemplates = [],
  actionTemplates = [],
  onUpdateTargets,
  onAddGestureTemplate,
  onAddActionTemplate,
  onOpenAddProcessDialog,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Dialog states for inline double-click editing
  const [editingGesture, setEditingGesture] = useState<{ targetId: string; binding: Binding } | null>(null);
  const [editingAction, setEditingAction] = useState<{ targetId: string; binding: Binding } | null>(null);
  const [addProcessTargetId, setAddProcessTargetId] = useState<string | null>(null);

  // Inline group rename state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tempGroupName, setTempGroupName] = useState("");

  const handleStartRename = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setTempGroupName(currentName);
  };

  const handleSaveRename = (groupId: string) => {
    const trimmed = tempGroupName.trim();
    if (trimmed) {
      const updated = targets.map((t) => (t.id === groupId ? { ...t, name: trimmed } : t));
      onUpdateTargets(updated);
    }
    setEditingGroupId(null);
  };

  const handleCancelRename = () => {
    setEditingGroupId(null);
  };

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

  const handleOpenAddGesture = (targetId: string, bindingId: string) => {
    const t = targets.find((item) => item.id === targetId);
    if (!t) return;
    const b = t.bindings.find((item) => item.id === bindingId);
    if (!b) return;
    setEditingGesture({ targetId, binding: b });
  };

  const handleOpenAddAction = (targetId: string, bindingId: string) => {
    const t = targets.find((item) => item.id === targetId);
    if (!t) return;
    const b = t.bindings.find((item) => item.id === bindingId);
    if (!b) return;
    setEditingAction({ targetId, binding: b });
  };

  const handleSelectPresetGesture = (targetId: string, bindingId: string, template: Gesture) => {
    const decoupled: Gesture = {
      ...template,
      id: `gesture-${Date.now()}`,
      name: t("gestureNames." + template.id, { defaultValue: template.name }),
    };
    handleSaveGestureDirect(targetId, bindingId, decoupled);
  };

  const handleSelectPresetAction = (targetId: string, bindingId: string, template: Action) => {
    const decoupled: Action = {
      ...template,
      id: `action-${Date.now()}`,
      name: t("actionNames." + template.id, { defaultValue: template.name }),
    };
    handleSaveActionDirect(targetId, bindingId, decoupled);
  };

  const handleSaveGestureDirect = (targetId: string, bindingId: string, updatedGesture: Gesture) => {
    const updated = targets.map((t) => {
      if (t.id !== targetId) return t;
      return {
        ...t,
        bindings: t.bindings.map((b) => {
          if (b.id !== bindingId) return b;
          const candidate = { ...b, gesture: updatedGesture };
          const emptyG = !updatedGesture.steps || updatedGesture.steps.length === 0;
          const emptyA = !b.action || !b.action.value || !b.action.value.trim();
          const isDup = t.bindings.some(
            (o) =>
              o.id !== b.id &&
              o.gesture.steps &&
              o.gesture.steps.length > 0 &&
              `${o.gesture.trigger}:${o.gesture.steps.join(",")}` ===
                `${updatedGesture.trigger}:${updatedGesture.steps.join(",")}`
          );
          const shouldEnable = !emptyG && !emptyA && !isDup;
          return {
            ...candidate,
            enabled: shouldEnable ? true : false,
          };
        }),
      };
    });
    onUpdateTargets(updated);
  };

  const handleSaveActionDirect = (targetId: string, bindingId: string, updatedAction: Action) => {
    const updated = targets.map((t) => {
      if (t.id !== targetId) return t;
      return {
        ...t,
        bindings: t.bindings.map((b) => {
          if (b.id !== bindingId) return b;
          const candidate = { ...b, action: updatedAction };
          const emptyG = !b.gesture.steps || b.gesture.steps.length === 0;
          const emptyA = !updatedAction.value || !updatedAction.value.trim();
          const isDup = t.bindings.some(
            (o) =>
              o.id !== b.id &&
              o.gesture.steps &&
              o.gesture.steps.length > 0 &&
              `${o.gesture.trigger}:${o.gesture.steps.join(",")}` ===
                `${b.gesture.trigger}:${b.gesture.steps.join(",")}`
          );
          const shouldEnable = !emptyG && !emptyA && !isDup;
          return {
            ...candidate,
            enabled: shouldEnable ? true : false,
          };
        }),
      };
    });
    onUpdateTargets(updated);
  };

  const isGestureEmpty = (b: Binding): boolean => {
    return !b.gesture || !b.gesture.steps || b.gesture.steps.length === 0;
  };

  const isActionEmpty = (b: Binding): boolean => {
    return !b.action || !b.action.value || !b.action.value.trim();
  };

  const isDuplicateGesture = (target: Target, b: Binding): boolean => {
    if (isGestureEmpty(b)) return false;
    const bKey = `${b.gesture.trigger}:${b.gesture.steps.join(",")}`;
    return target.bindings.some(
      (other) =>
        other.id !== b.id &&
        !isGestureEmpty(other) &&
        `${other.gesture.trigger}:${other.gesture.steps.join(",")}` === bKey
    );
  };

  const isBindingInvalid = (target: Target, b: Binding): boolean => {
    return isGestureEmpty(b) || isActionEmpty(b) || isDuplicateGesture(target, b);
  };

  const handleSaveGesture = (updatedGesture: Gesture, addToTemplates?: boolean) => {
    if (!editingGesture) return;
    const { targetId, binding } = editingGesture;
    const updated = targets.map((t) => {
      if (t.id !== targetId) return t;
      return {
        ...t,
        bindings: t.bindings.map((b) => {
          if (b.id !== binding.id) return b;
          const candidate = { ...b, gesture: updatedGesture };
          const emptyG = !updatedGesture.steps || updatedGesture.steps.length === 0;
          const emptyA = !b.action || !b.action.value || !b.action.value.trim();
          const isDup = t.bindings.some(
            (o) =>
              o.id !== b.id &&
              o.gesture.steps &&
              o.gesture.steps.length > 0 &&
              `${o.gesture.trigger}:${o.gesture.steps.join(",")}` ===
                `${updatedGesture.trigger}:${updatedGesture.steps.join(",")}`
          );
          const shouldEnable = !emptyG && !emptyA && !isDup;
          return {
            ...candidate,
            enabled: shouldEnable ? true : false,
          };
        }),
      };
    });
    onUpdateTargets(updated);

    if (addToTemplates && onAddGestureTemplate) {
      onAddGestureTemplate({
        ...updatedGesture,
        id: `gesture-${Date.now()}`,
        name: updatedGesture.name || "新自訂手勢",
      });
    }

    setEditingGesture(null);
  };

  const handleSaveAction = (updatedAction: Action) => {
    if (!editingAction) return;
    const { targetId, binding } = editingAction;
    const updated = targets.map((t) => {
      if (t.id !== targetId) return t;
      return {
        ...t,
        bindings: t.bindings.map((b) => {
          if (b.id !== binding.id) return b;
          const candidate = { ...b, action: updatedAction };
          const emptyG = !b.gesture.steps || b.gesture.steps.length === 0;
          const emptyA = !updatedAction.value || !updatedAction.value.trim();
          const isDup = t.bindings.some(
            (o) =>
              o.id !== b.id &&
              o.gesture.steps &&
              o.gesture.steps.length > 0 &&
              `${o.gesture.trigger}:${o.gesture.steps.join(",")}` ===
                `${b.gesture.trigger}:${b.gesture.steps.join(",")}`
          );
          const shouldEnable = !emptyG && !emptyA && !isDup;
          return {
            ...candidate,
            enabled: shouldEnable ? true : false,
          };
        }),
      };
    });
    onUpdateTargets(updated);
    setEditingAction(null);
  };

  const globalTarget = targets.find((t) => t.kind === "global");
  const specificGroups = targets.filter((t) => t.kind === "group");

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
          {target.bindings.map((b) => {
            const emptyGesture = isGestureEmpty(b);
            const emptyAction = isActionEmpty(b);
            const duplicate = isDuplicateGesture(target, b);
            const invalid = emptyGesture || emptyAction || duplicate;

            return (
              <tr key={b.id} className={styles.tr}>
                <td className={styles.tdCheckbox}>
                  <Checkbox
                    checked={!invalid && b.enabled}
                    disabled={invalid}
                    onChange={(_, data) => handleToggleBinding(target.id, b.id, !!data.checked)}
                    title={
                      invalid
                        ? duplicate
                          ? t("targets.duplicateTooltip")
                          : t("targets.incompleteTooltip")
                        : undefined
                    }
                  />
                </td>
                <td className={styles.tdGesture}>
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <div
                        className={styles.cellTriggerArea}
                        title={t("targets.doubleClickGestureTip")}
                      >
                        {emptyGesture ? (
                          <span style={{ color: tokens.colorNeutralForeground4, fontStyle: "italic" }}>
                            {t("targets.noGesture")}
                          </span>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>{formatGestureLabel(b.gesture.trigger, b.gesture.steps, t)}</span>
                            {duplicate && (
                              <Badge appearance="tint" color="danger" size="small">
                                {t("targets.duplicateGesture")}
                              </Badge>
                            )}
                          </div>
                        )}
                        <ChevronDown16Regular style={{ color: tokens.colorNeutralForeground4, flexShrink: 0 }} />
                      </div>
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList style={{ maxHeight: "260px", overflowY: "auto" }}>
                        {gestureTemplates.map((gt) => (
                          <MenuItem
                            key={gt.id}
                            onClick={() => handleSelectPresetGesture(target.id, b.id, gt)}
                          >
                            {t("gestureNames." + gt.id, { defaultValue: gt.name })} ({formatGestureLabel(gt.trigger, gt.steps, t)})
                          </MenuItem>
                        ))}
                        <MenuDivider />
                        <MenuItem
                          icon={<Add16Regular />}
                          onClick={() => handleOpenAddGesture(target.id, b.id)}
                        >
                          {t("targets.addNewGesture", { defaultValue: "新增手勢..." })}
                        </MenuItem>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                </td>
                <td className={styles.tdAction}>
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <div
                        className={styles.cellTriggerArea}
                        title={b.action.value ? `${t("targets.doubleClickActionTip")} (${b.action.value})` : t("targets.doubleClickActionTip")}
                      >
                        {emptyAction ? (
                          <span style={{ color: tokens.colorNeutralForeground4, fontStyle: "italic" }}>
                            {t("targets.noAction")}
                          </span>
                        ) : (
                          <span>
                            {t("actionNames." + b.action.id, { defaultValue: b.action.name }) || b.action.value}
                          </span>
                        )}
                        <ChevronDown16Regular style={{ color: tokens.colorNeutralForeground4, flexShrink: 0 }} />
                      </div>
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList style={{ maxHeight: "260px", overflowY: "auto" }}>
                        {actionTemplates.map((at) => (
                          <MenuItem
                            key={at.id}
                            onClick={() => handleSelectPresetAction(target.id, b.id, at)}
                          >
                            {t("actionNames." + at.id, { defaultValue: at.name })} ({at.value})
                          </MenuItem>
                        ))}
                        <MenuDivider />
                        <MenuItem
                          icon={<Add16Regular />}
                          onClick={() => handleOpenAddAction(target.id, b.id)}
                        >
                          {t("targets.addNewAction", { defaultValue: "新增動作..." })}
                        </MenuItem>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
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
            );
          })}
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
            </div>
          </div>
          <Card className={styles.card}>
            {renderBindingsTable(globalTarget)}
            <div>
              <Button
                size="small"
                appearance="subtle"
                icon={<Add16Regular />}
                onClick={() => {
                  const newBinding: Binding = {
                    id: `b-${Date.now()}`,
                    enabled: false,
                    gesture: { id: `g-${Date.now()}`, name: "", trigger: "R", steps: [] },
                    action: { id: `a-${Date.now()}`, name: "", type: "keys", value: "" },
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
          </Card>
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
          const groupDisplayName =
            group.name !== "Browsers" && group.name !== "Group 01"
              ? group.name
              : t("targets." + group.id + "Title", { defaultValue: group.name });
          return (
            <Card key={group.id} className={styles.card}>
              <div className={styles.groupHeader}>
                <div
                  className={styles.groupTitleArea}
                  onClick={() => !editingGroupId && toggleGroupCollapse(group.id)}
                >
                  {isCollapsed ? <ChevronRight16Regular /> : <ChevronDown16Regular />}
                  {editingGroupId === group.id ? (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "4px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        size="small"
                        value={tempGroupName}
                        autoFocus
                        placeholder={t("targets.renameGroupPlaceholder")}
                        onChange={(_, data) => setTempGroupName(data.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveRename(group.id);
                          } else if (e.key === "Escape") {
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
                        onDoubleClick={(e) => {
                          e.stopPropagation();
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(group.id, groupDisplayName);
                        }}
                      />
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
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
                  <div className={styles.tagList}>
                    <Caption1 style={{ color: tokens.colorNeutralForeground3, fontWeight: 600 }}>
                      {t("targets.includedApps")}
                    </Caption1>
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

                  <div style={{ marginTop: "4px" }}>
                    {renderBindingsTable(group)}
                  </div>

                  <div>
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<Add16Regular />}
                      onClick={() => {
                        const newBinding: Binding = {
                          id: `b-${Date.now()}`,
                          enabled: false,
                          gesture: { id: `g-${Date.now()}`, name: "", trigger: "R", steps: [] },
                          action: { id: `a-${Date.now()}`, name: "", type: "keys", value: "" },
                        };
                        const updated = targets.map((t) =>
                          t.id === group.id ? { ...t, bindings: [...t.bindings, newBinding] } : t
                        );
                        onUpdateTargets(updated);
                      }}
                    >
                      {t("targets.addGesture")}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          );
        })}
      </div>

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
