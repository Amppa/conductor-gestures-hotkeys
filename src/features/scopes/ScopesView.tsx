import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  makeStyles,
  tokens,
  Card,
  Tooltip,
  Subtitle2,
  Caption1,
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import {
  Add16Regular,
} from "@fluentui/react-icons";
import { Target, Binding, Gesture, Action } from "../../domain/types";
import { findConflictingBindings } from "../../domain/ruleValidation";
import {
  addBinding,
  addExecutable,
  createEmptyBinding,
  removeBinding,
  removeExecutable,
  renameTarget,
  replaceBindingAction,
  replaceBindingGesture,
  replaceConflictingBindings,
  setBindingEnabled,
} from "../../domain/targetMutations";
import { formatGestureLabel } from "../gestures/gestureSymbols";
import { isKeyboardTemplate, type TriggerCategory } from "../../domain/triggerTypes";
import { formatBindingTrigger, RuleTable } from "./RuleTable";
import { ScopeGroupCard } from "./ScopeGroupCard";
import { useRuleDragDrop } from "./useRuleDragDrop";
import { formatHotkeyTrigger } from "../hotkeys/hotkeyTrigger";
import { EditGestureDialog } from "../gestures/EditGestureDialog";
import { EditHotkeyDialog } from "../hotkeys/EditHotkeyDialog";
import { EditCommandDialog } from "../commands/EditCommandDialog";
import type { CommandCategory } from "../../domain/commandCategories";
import { AddProcessDialog } from "./AddProcessDialog";
import { PageHeader, usePageStyles } from "../../shared/pageStyles";
import { formatActionName, formatScopeName } from "../../shared/displayNames";
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
  const { t, i18n } = useTranslation();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [editingGesture, setEditingGesture] = useState<{
    targetId: string;
    binding: Binding;
  } | null>(null);
  const [editingAction, setEditingAction] = useState<{
    targetId: string;
    binding: Binding;
    category: CommandCategory;
  } | null>(null);
  const [addProcessTargetId, setAddProcessTargetId] = useState<string | null>(null);
  const [pendingDeleteGroupId, setPendingDeleteGroupId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tempGroupName, setTempGroupName] = useState("");
  const [pendingConflict, setPendingConflict] = useState<{
    targetId: string;
    binding: Binding;
    conflicts: Binding[];
  } | null>(null);

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
      trigger: category === "screen" ? "EdgeTop" : category === "hotkeys" ? "" : category === "mouseButtons" ? "X1" : "R",
      steps: category === "screen" ? ["WU"] : [],
    } } });
  };

  const handleOpenActionEditor = (targetId: string, bindingId: string, category: CommandCategory) => {
    const binding = findBinding(targetId, bindingId);
    if (binding) {
      setEditingAction({ targetId, category, binding: { ...binding, action: {
        id: createId("action"), name: t("actions.newActionName"), type: category === "scriptCommands" ? "ahk" : "keys", value: "",
      } } });
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
      name: formatActionName(t, template),
    });
  };

  const handleSaveGesture = (updatedGesture: Gesture) => {
    if (!editingGesture) {
      return;
    }
    handleSaveGestureDirect(
      editingGesture.targetId,
      editingGesture.binding.id,
      updatedGesture,
    );

    if (creationCategory && onAddGestureTemplate) {
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
    if (checked) {
      const target = targets.find((item) => item.id === targetId);
      const binding = target?.bindings.find((item) => item.id === bindingId);
      const conflicts =
        target && binding
          ? findConflictingBindings(target.bindings, bindingId, binding.gesture)
          : [];
      if (binding && conflicts.length > 0) {
        setPendingConflict({ targetId, binding, conflicts });
        return;
      }
    }
    onUpdateTargets(setBindingEnabled(targets, targetId, bindingId, checked));
  };

  const handleConfirmReplaceConflict = () => {
    if (!pendingConflict) return;
    onUpdateTargets(
      replaceConflictingBindings(
        targets,
        pendingConflict.targetId,
        pendingConflict.binding.id,
      ),
    );
    setPendingConflict(null);
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
    <RuleTable
      target={target}
      gestureTemplates={gestureTemplates}
      actionTemplates={actionTemplates}
      rowDropProps={rowDropProps}
      dragHandleProps={dragHandleProps}
      onToggle={handleToggleBinding}
      onSelectGesture={handleSelectPresetGesture}
      onCreateTrigger={handleCreateTrigger}
      onSelectAction={handleSelectPresetAction}
      onEditAction={handleOpenActionEditor}
      onDelete={handleDeleteBinding}
    />
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

        {specificGroups.map((group) => (
          <ScopeGroupCard
            key={group.id}
            group={group}
            isCollapsed={!!collapsedGroups[group.id]}
            isDropTarget={hoverScope === group.id}
            dropProps={scopeDropProps(group)}
            rename={{
              editingId: editingGroupId,
              draft: tempGroupName,
              onStart: handleStartRename,
              onChange: setTempGroupName,
              onSave: handleSaveRename,
              onCancel: handleCancelRename,
            }}
            onToggleCollapse={toggleGroupCollapse}
            onDelete={setPendingDeleteGroupId}
            onDeleteExecutable={handleDeleteExe}
            onAddProcess={setAddProcessTargetId}
            onAddRule={() => onUpdateTargets(addBinding(targets, group.id, createEmptyBinding()))}
          >
            {renderBindingsTable(group)}
          </ScopeGroupCard>
        ))}
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
          isCreating
          buttonMode={creationCategory === "mouseButtons"}
          screenMode={creationCategory === "screen"}
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
          category={editingAction.category}
          onSave={handleSaveAction}
          onCancel={() => setEditingAction(null)}
        />
      )}

      {addProcessTargetId && (() => {
        const selectedTarget = targets.find((target) => target.id === addProcessTargetId);
        return (
          <AddProcessDialog
            open={!!addProcessTargetId}
            targetName={selectedTarget ? formatScopeName(t, selectedTarget) : "Target List"}
            onAdd={handleAddProcessExe}
            onCancel={() => setAddProcessTargetId(null)}
          />
        );
      })()}

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

      <Dialog
        open={!!pendingConflict}
        onOpenChange={(_, data) => !data.open && setPendingConflict(null)}
      >
        <DialogSurface style={{ maxWidth: "520px" }}>
          <DialogBody>
            <DialogTitle>{t("targets.conflictReplaceTitle")}</DialogTitle>
            {pendingConflict && (() => {
              const formatRuleSummary = (item: Binding) =>
                `${formatBindingTrigger(t, item.gesture)} → ${formatActionName(t, item.action)}`;
              const activeSummary = pendingConflict.conflicts
                .map(formatRuleSummary)
                .join(" / ");
              const pendingSummary = formatRuleSummary(pendingConflict.binding);
              return (
                <>
                  <DialogContent
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      paddingTop: "8px",
                    }}
                  >
                    <div>{t("targets.conflictActiveLine", { summary: activeSummary })}</div>
                    <div>{t("targets.conflictPendingLine", { summary: pendingSummary })}</div>
                  </DialogContent>
                  <DialogActions style={{ paddingTop: "12px" }}>
                    <Button
                      appearance="secondary"
                      onClick={() => setPendingConflict(null)}
                    >
                      {t("targets.conflictKeepBtn")}
                    </Button>
                    <Button
                      appearance="primary"
                      onClick={handleConfirmReplaceConflict}
                    >
                      {t("targets.conflictSwitchBtn")}
                    </Button>
                  </DialogActions>
                </>
              );
            })()}
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
