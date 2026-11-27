import { makeStyles, tokens, Badge, Button, Checkbox } from "@fluentui/react-components";
import { Delete16Regular, ChevronDown16Regular } from "@fluentui/react-icons";
import type { CommandCategory } from "../../domain/commandCategories";
import { CommandPresetMenu } from "./CommandPresetMenu";
import { useTranslation } from "react-i18next";
import type { Target, Gesture, Action } from "../../domain/types";
import { isKeyboardTemplate, type TriggerCategory } from "../../domain/triggerTypes";
import { isActionIncomplete, isBindingInvalid, isDuplicateGesture, isGestureIncomplete } from "../../domain/bindingRules";
import { formatGestureLabel } from "../gestures/gestureSymbols";
import { formatHotkeyTrigger } from "../hotkeys/hotkeyTrigger";
import { TriggerPresetMenu } from "./TriggerPresetMenu";
import type { useRuleDragDrop } from "./useRuleDragDrop";
import { usePageStyles } from "../../shared/pageStyles";
import { formatActionName } from "../../shared/displayNames";

const useStyles = makeStyles({
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

interface RuleTableProps {
  target: Target;
  gestureTemplates: Gesture[];
  actionTemplates: Action[];
  rowDropProps: ReturnType<typeof useRuleDragDrop>["rowDropProps"];
  dragHandleProps: ReturnType<typeof useRuleDragDrop>["dragHandleProps"];
  onToggle: (targetId: string, bindingId: string, enabled: boolean) => void;
  onSelectGesture: (targetId: string, bindingId: string, template: Gesture) => void;
  onCreateTrigger: (targetId: string, bindingId: string, category: TriggerCategory) => void;
  onSelectAction: (targetId: string, bindingId: string, template: Action) => void;
  onEditAction: (targetId: string, bindingId: string, category: CommandCategory) => void;
  onDelete: (targetId: string, bindingId: string) => void;
}

export function RuleTable({
  target, gestureTemplates, actionTemplates, rowDropProps, dragHandleProps,
  onToggle: handleToggleBinding, onSelectGesture: handleSelectPresetGesture,
  onCreateTrigger: handleCreateTrigger, onSelectAction: handleSelectPresetAction,
  onEditAction: handleOpenActionEditor, onDelete: handleDeleteBinding,
}: RuleTableProps) {
  const { t } = useTranslation();
  const page = usePageStyles();
  const styles = useStyles();
  return (
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
                            {isKeyboardTemplate(binding.gesture)
                              ? formatHotkeyTrigger(binding.gesture.trigger)
                              : formatGestureLabel(
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
                <CommandPresetMenu templates={actionTemplates} menuClassName={styles.menuList}
                  onSelect={(template) => handleSelectPresetAction(target.id, binding.id, template)}
                  onCreate={(category) => handleOpenActionEditor(target.id, binding.id, category)}>
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
                </CommandPresetMenu>
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
}
