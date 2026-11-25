import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  makeStyles,
  tokens,
  Card,
  Tooltip,
  Subtitle2,
  Caption1,
  Badge,
  Button,
  Checkbox,
  Tag,
  Input,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
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
import { Target, Binding, Gesture, Action } from "../../domain/types";
import {
  isActionIncomplete,
  isBindingInvalid,
  isDuplicateGesture,
  isGestureIncomplete,
} from "../../domain/bindingRules";
import {
  addBinding,
  addExecutable,
  createEmptyBinding,
  removeBinding,
  removeExecutable,
  renameTarget,
  replaceBindingAction,
  replaceBindingGesture,
  setBindingEnabled,
} from "../../domain/targetMutations";
import { formatGestureLabel } from "../gestures/gestureSymbols";
import { isKeyboardTemplate, isScreenTemplate, type TriggerCategory } from "../../domain/triggerTypes";
import { TriggerPresetMenu } from "./TriggerPresetMenu";
import { useRuleDragDrop } from "./useRuleDragDrop";
import { formatHotkeyTrigger } from "../hotkeys/hotkeyTrigger";
import { EditGestureDialog } from "../gestures/EditGestureDialog";
import { EditHotkeyDialog } from "../hotkeys/EditHotkeyDialog";
import { EditCommandDialog } from "../commands/EditCommandDialog";
import { AddProcessDialog } from "./AddProcessDialog";
import { PageHeader, usePageStyles } from "../../shared/pageStyles";
import { formatActionName } from "../../shared/displayNames";
import { createId } from "../../shared/ids";

const useStyles = makeStyles({
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
  scopesRow: {
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  tdCheckbox: {
    width: "72px",
    padding: "6px 8px",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },
  ruleControls: {
    display: "inline-flex",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: "4px",
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
  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },
  emptyValue: {
    color: tokens.colorNeutralForeground4,
    fontStyle: "italic",
  },
  gestureValue: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  menuList: {
    width: "max-content",
    maxWidth: "min(480px, calc(100vw - 48px))",
    maxHeight: "260px",
    overflowY: "auto",
    overflowX: "hidden",
    "& [role='menuitem']": {
      whiteSpace: "normal",
      overflowWrap: "anywhere",
    },
  },
});

interface ScopesViewProps {
  targets: Target[];
  gestureTemplates?: Gesture[];
  actionTemplates?: Action[];
  onUpdateTargets: (updated: Target[]) => void;
  onAddGestureTemplate?: (newTemplate: Gesture) => void;
}

export const ScopesView: React.FC<ScopesViewProps> = ({
  targets,
  gestureTemplates = [],
  actionTemplates = [],
  onUpdateTargets,
  onAddGestureTemplate,
}) => {
  const page = usePageStyles();
  const styles = useStyles();
  const { t } = useTranslation();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [editingGesture, setEditingGesture] = useState<{
    targetId: string;
    binding: Binding;
  } | null>(null);
  const [editingAction, setEditingAction] = useState<{
    targetId: string;
    binding: Binding;
  } | null>(null);
  const [addProcessTargetId, setAddProcessTargetId] = useState<string | null>(null);
  const [pendingDeleteGroupId, setPendingDeleteGroupId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tempGroupName, setTempGroupName] = useState("");

  const findBinding = (targetId: string, bindingId: string): Binding | null => {
    const target = targets.find((item) => item.id === targetId);
    return target?.bindings.find((item) => item.id === bindingId) ?? null;
  };

  const handleStartRename = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setTempGroupName(currentName);
  };

  const handleSaveRename = (groupId: string) => {
    onUpdateTargets(renameTarget(targets, groupId, tempGroupName));
    setEditingGroupId(null);
  };

  const handleCancelRename = () => {
    setEditingGroupId(null);
  };

  const toggleGroupCollapse = (id: string) => {
    setCollapsedGroups((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  const [creationCategory, setCreationCategory] = useState<TriggerCategory | null>(null);
  const handleCreateTrigger = (targetId: string, bindingId: string, category: TriggerCategory) => {
    const binding = findBinding(targetId, bindingId);
    if (!binding) return;
    setCreationCategory(category);
    setEditingGesture({ targetId, binding: { ...binding, gesture: {
      id: createId("gesture"),
      trigger: category === "screen" ? "EdgeTop" : category === "hotkeys" ? "" : "R",
      steps: category === "screen" ? ["WU"] : [],
    } } });
  };

  const handleOpenActionEditor = (targetId: string, bindingId: string) => {
    const binding = findBinding(targetId, bindingId);
    if (binding) {
      setEditingAction({ targetId, binding });
    }
  };

  const handleSaveGestureDirect = (
    targetId: string,
    bindingId: string,
    gesture: Gesture,
  ) => {
    onUpdateTargets(replaceBindingGesture(targets, targetId, bindingId, gesture));
  };

  const handleSaveActionDirect = (
    targetId: string,
    bindingId: string,
    action: Action,
  ) => {
    onUpdateTargets(replaceBindingAction(targets, targetId, bindingId, action));
  };

  const handleSelectPresetGesture = (
    targetId: string,
    bindingId: string,
    template: Gesture,
  ) => {
    handleSaveGestureDirect(targetId, bindingId, {
      ...template,
      id: createId("gesture"),
      steps: [...template.steps],
    });
  };

  const handleSelectPresetAction = (
    targetId: string,
    bindingId: string,
    template: Action,
  ) => {
    handleSaveActionDirect(targetId, bindingId, {
      ...template,
      id: createId("action"),
      name: t(`actionNames.${template.id}`, { defaultValue: template.name }),
    });
  };

  const handleSaveGesture = (updatedGesture: Gesture, addToTemplates?: boolean) => {
    if (!editingGesture) {
      return;
    }
    handleSaveGestureDirect(
      editingGesture.targetId,
      editingGesture.binding.id,
      updatedGesture,
    );

    if ((addToTemplates || creationCategory) && onAddGestureTemplate) {
      onAddGestureTemplate({
        ...updatedGesture,
        id: createId("gesture"),
      });
    }

    setEditingGesture(null);
  };

  const handleSaveAction = (updatedAction: Action) => {
    if (!editingAction) {
      return;
    }
    handleSaveActionDirect(
      editingAction.targetId,
      editingAction.binding.id,
      updatedAction,
    );
    setEditingAction(null);
  };

  const handleToggleBinding = (
    targetId: string,
    bindingId: string,
    checked: boolean,
  ) => {
    onUpdateTargets(setBindingEnabled(targets, targetId, bindingId, checked));
  };

  const handleDeleteBinding = (targetId: string, bindingId: string) => {
    onUpdateTargets(removeBinding(targets, targetId, bindingId));
  };

  const handleAddProcessExe = (executable: string) => {
    if (!addProcessTargetId) {
      return;
    }
    onUpdateTargets(addExecutable(targets, addProcessTargetId, executable));
  };

  const handleDeleteExe = (targetId: string, executable: string) => {
    onUpdateTargets(removeExecutable(targets, targetId, executable));
  };

  const handleAddGroup = () => {
    onUpdateTargets([
      ...targets,
      {
        id: createId("group"),
        name: t("targets.newGroupName"),
        enabled: true,
        kind: "group",
        executables: ["example.exe"],
        bindings: [],
      },
    ]);
  };

  const handleConfirmDeleteGroup = () => {
    if (!pendingDeleteGroupId) {
      return;
    }
    onUpdateTargets(
      targets.filter((target) => target.id !== pendingDeleteGroupId),
    );
    setPendingDeleteGroupId(null);
  };

  const globalTarget = targets.find((target) => target.kind === "global");
  const { i18n } = useTranslation();
  const sortRules = () => {
    const english = i18n.getFixedT("en");
    const label = (binding: Binding) => (isKeyboardTemplate(binding.gesture)
      ? formatHotkeyTrigger(binding.gesture.trigger)
      : formatGestureLabel(binding.gesture.trigger, binding.gesture.steps, english))
      .replace(/^[⬒⬓◧◨◰◱◲◳]\s*/, "");
    const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
    onUpdateTargets(targets.map((target) => ({ ...target, bindings: [...target.bindings].sort((a, b) =>
      Number(b.enabled) - Number(a.enabled) || compare(label(a), label(b)) ||
      (!a.enabled && !b.enabled ? compare(formatActionName(english, a.action), formatActionName(english, b.action)) : 0),
    ) })));
  };
  const specificGroups = targets.filter((target) => target.kind === "group");
  const { hoverScope, moveNotice, scopeName, scopeDropProps, rowDropProps, dragHandleProps } = useRuleDragDrop(targets, onUpdateTargets);

  const renderBindingsTable = (target: Target) => (
    <table className={page.table}>
      <thead>
        <tr>
          <th className={page.th}></th>
          <th className={page.th}>{t("targets.tableGesture")}</th>
          <th className={page.th}>{t("targets.tableAction")}</th>
          <th className={page.th}></th>
        </tr>
      </thead>
      <tbody>
        {target.bindings.map((binding) => {
          const emptyGesture = isGestureIncomplete(binding.gesture);
          const emptyAction = isActionIncomplete(binding.action);
          const duplicate = isDuplicateGesture(target, binding);
          const invalid = isBindingInvalid(target, binding);

          return (
            <tr key={binding.id} className={`${page.row} ${styles.scopesRow}`}
              {...rowDropProps(target, binding.id)}>
              <td className={styles.tdCheckbox}>
                <div className={styles.ruleControls}>
                <span {...dragHandleProps(target.id, binding.id)}
                  title={t("targets.dragRule")} aria-label={t("targets.dragRule")}
                  style={{ cursor: "grab", userSelect: "none", fontSize: 20 }}>⠿</span>
                <Checkbox
                  checked={!invalid && binding.enabled}
                  disabled={invalid}
                  onChange={(_, data) =>
                    handleToggleBinding(target.id, binding.id, !!data.checked)
                  }
                  title={
                    invalid
                      ? duplicate
                        ? t("targets.duplicateTooltip")
                        : t("targets.incompleteTooltip")
                      : undefined
                  }
                />
                </div>
              </td>
              <td className={styles.tdGesture}>
                <TriggerPresetMenu
                  templates={gestureTemplates}
                  menuClassName={styles.menuList}
                  onSelect={(template) => handleSelectPresetGesture(target.id, binding.id, template)}
                  onCreate={(category) => handleCreateTrigger(target.id, binding.id, category)}
                >
                    <div
                      className={styles.cellTriggerArea}
                      title={t("targets.doubleClickGestureTip")}
                    >
                      {emptyGesture ? (
                        <span className={styles.emptyValue}>
                          {t("targets.noGesture")}
                        </span>
                      ) : (
                        <div className={styles.gestureValue}>
                          <span>
                            {formatGestureLabel(
                              binding.gesture.trigger,
                              binding.gesture.steps,
                              t,
                            )}
                          </span>
                          {duplicate && (
                            <Badge appearance="tint" color="danger" size="small">
                              {t("targets.duplicateGesture")}
                            </Badge>
                          )}
                        </div>
                      )}
                      <ChevronDown16Regular
                        style={{
                          color: tokens.colorNeutralForeground4,
                          flexShrink: 0,
                        }}
                      />
                    </div>
                </TriggerPresetMenu>
              </td>
              <td className={styles.tdAction}>
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <div
                      className={styles.cellTriggerArea}
                      title={
                        binding.action.value
                          ? `${t("targets.doubleClickActionTip")} (${binding.action.value})`
                          : t("targets.doubleClickActionTip")
                      }
                    >
                      {emptyAction ? (
                        <span className={styles.emptyValue}>
                          {t("targets.noAction")}
                        </span>
                      ) : (
                        <span>
                          {formatActionName(t, binding.action) ||
                            binding.action.value}
                        </span>
                      )}
                      <ChevronDown16Regular
                        style={{
                          color: tokens.colorNeutralForeground4,
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList className={styles.menuList}>
                      {actionTemplates.map((template) => (
                        <MenuItem
                          key={template.id}
                          onClick={() =>
                            handleSelectPresetAction(target.id, binding.id, template)
                          }
                        >
                          {formatActionName(t, template)} ({template.value})
                        </MenuItem>
                      ))}
                      <MenuDivider />
                      <MenuItem
                        icon={<Add16Regular />}
                        onClick={() => handleOpenActionEditor(target.id, binding.id)}
                      >
                        {t("targets.addNewAction")}
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </td>
              <td className={page.opsCell}>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Delete16Regular />}
                  onClick={() => handleDeleteBinding(target.id, binding.id)}
                  title={t("targets.deleteGestureTip")}
                />
              </td>
            </tr>
          );
        })}
        {target.bindings.length === 0 && (
          <tr>
            <td colSpan={4} className={page.emptyCell}>
              {t("targets.emptyBindings")}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className={page.container}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <PageHeader title={t("nav.targets")} />
        <Button onClick={sortRules}>{t("targets.sortNow")}</Button>
      </div>
      {moveNotice && <div role="status">{moveNotice}</div>}

      {globalTarget && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Subtitle2>
              {t("targets.globalTitle", { defaultValue: globalTarget.name })}
            </Subtitle2>
          </div>
          <Tooltip content={t("targets.moveTo", { name: scopeName(globalTarget) })} relationship="description" visible={hoverScope === globalTarget.id}>
          <Card className={page.card} {...scopeDropProps(globalTarget)}>
            {renderBindingsTable(globalTarget)}
            <div>
              <Button
                size="small"
                appearance="subtle"
                icon={<Add16Regular />}
                onClick={() =>
                  onUpdateTargets(
                    addBinding(targets, globalTarget.id, createEmptyBinding()),
                  )
                }
              >
                {t("targets.addGesture")}
              </Button>
            </div>
          </Card>
          </Tooltip>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <Subtitle2>{t("targets.specificSection")}</Subtitle2>
            <Caption1
              style={{
                display: "block",
                color: tokens.colorNeutralForeground3,
              }}
            >
              {t("targets.whitelistDesc")}
            </Caption1>
          </div>
          <Button
            size="small"
            appearance="secondary"
            icon={<Add16Regular />}
            onClick={handleAddGroup}
          >
            {t("targets.addGroup")}
          </Button>
        </div>

        {specificGroups.map((group) => {
          const isCollapsed = collapsedGroups[group.id];
          const groupDisplayName =
            group.name !== "Browsers" && group.name !== "Group 01"
              ? group.name
              : t(`targets.${group.id}Title`, { defaultValue: group.name });

          return (
            <Tooltip key={group.id} content={t("targets.moveTo", { name: groupDisplayName })} relationship="description" visible={hoverScope === group.id}>
            <Card className={page.card} {...scopeDropProps(group)}>
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
                    {renderBindingsTable(group)}
                  </div>

                  <div>
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<Add16Regular />}
                      onClick={() =>
                        onUpdateTargets(
                          addBinding(targets, group.id, createEmptyBinding()),
                        )
                      }
                    >
                      {t("targets.addGesture")}
                    </Button>
                  </div>
                </>
              )}
            </Card>
            </Tooltip>
          );
        })}
      </div>

      {editingGesture && creationCategory === "hotkeys" && (
        <EditHotkeyDialog
          hotkey={editingGesture.binding.gesture}
          existingHotkeys={gestureTemplates.filter(isKeyboardTemplate)}
          isCreating
          onSave={handleSaveGesture}
          onCancel={() => setEditingGesture(null)}
        />
      )}
      {editingGesture && creationCategory !== "hotkeys" && (
        <EditGestureDialog
          screenMode={creationCategory === "screen" || (!creationCategory && isScreenTemplate(editingGesture.binding.gesture))}
          open={!!editingGesture}
          gesture={editingGesture.binding.gesture}
          onSave={handleSaveGesture}
          onCancel={() => setEditingGesture(null)}
        />
      )}

      {editingAction && (
        <EditCommandDialog
          open={!!editingAction}
          action={editingAction.binding.action}
          onSave={handleSaveAction}
          onCancel={() => setEditingAction(null)}
        />
      )}

      {addProcessTargetId && (
        <AddProcessDialog
          open={!!addProcessTargetId}
          targetName={t(`targets.${addProcessTargetId}Title`, {
            defaultValue:
              targets.find((target) => target.id === addProcessTargetId)?.name ||
              "Target List",
          })}
          onAdd={handleAddProcessExe}
          onCancel={() => setAddProcessTargetId(null)}
        />
      )}

      <Dialog
        open={!!pendingDeleteGroupId}
        onOpenChange={(_, data) => !data.open && setPendingDeleteGroupId(null)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("targets.deleteGroupConfirmTitle")}</DialogTitle>
            <DialogContent>
              {t("targets.deleteGroupConfirmMessage", {
                name:
                  targets.find((target) => target.id === pendingDeleteGroupId)
                    ?.name || "",
              })}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setPendingDeleteGroupId(null)}
              >
                {t("dialogs.cancel")}
              </Button>
              <Button appearance="primary" onClick={handleConfirmDeleteGroup}>
                {t("targets.deleteGroupConfirm")}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
