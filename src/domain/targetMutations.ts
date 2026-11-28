import { findConflictingBindings, hasEnabledGestureDuplicate } from "./ruleValidation";
import { isActionIncomplete, isGestureIncomplete, shouldEnableBinding } from "./bindingRules";
import { createId } from "../shared/ids";
import { Action, Binding, Gesture, Target } from "./types";

type BindingUpdater = (target: Target, binding: Binding) => Binding;

export function moveBinding(
  targets: Target[], sourceId: string, destinationId: string,
  bindingId: string, beforeId?: string, after = false,
): { targets: Target[]; conflict: boolean; moved: boolean } {
  const source = targets.find((target) => target.id === sourceId);
  const destination = targets.find((target) => target.id === destinationId);
  const binding = source?.bindings.find((item) => item.id === bindingId);
  if (!binding || !destination || destination.kind === "disabled" || bindingId === beforeId ||
      (beforeId && !destination.bindings.some((item) => item.id === beforeId))) {
    return { targets, conflict: false, moved: false };
  }
  const conflict = sourceId !== destinationId && binding.enabled &&
    hasEnabledGestureDuplicate(destination.bindings, binding.id, binding.gesture);
  const movedBinding = conflict ? { ...binding, enabled: false } : binding;
  return {
    conflict, moved: true,
    targets: targets.map((target) => {
      if (target.id !== sourceId && target.id !== destinationId) return target;
      const bindings = target.bindings.filter((item) => item.id !== bindingId);
      if (target.id === destinationId) {
        const index = beforeId ? bindings.findIndex((item) => item.id === beforeId) : bindings.length;
        bindings.splice(index + (beforeId && after ? 1 : 0), 0, movedBinding);
      }
      return { ...target, bindings };
    }),
  };
}

function updateBinding(
  targets: Target[],
  targetId: string,
  bindingId: string,
  updater: BindingUpdater,
): Target[] {
  return targets.map((target) => {
    if (target.id !== targetId) {
      return target;
    }
    return {
      ...target,
      bindings: target.bindings.map((binding) =>
        binding.id === bindingId ? updater(target, binding) : binding,
      ),
    };
  });
}

export function replaceBindingGesture(
  targets: Target[],
  targetId: string,
  bindingId: string,
  gesture: Gesture,
): Target[] {
  return updateBinding(targets, targetId, bindingId, (target, binding) => ({
    ...binding,
    gesture,
    enabled: shouldEnableBinding(target, binding.id, gesture, binding.action),
  }));
}

export function replaceBindingAction(
  targets: Target[],
  targetId: string,
  bindingId: string,
  action: Action,
): Target[] {
  return updateBinding(targets, targetId, bindingId, (target, binding) => ({
    ...binding,
    action,
    enabled: shouldEnableBinding(target, binding.id, binding.gesture, action),
  }));
}

export function setBindingEnabled(
  targets: Target[],
  targetId: string,
  bindingId: string,
  enabled: boolean,
): Target[] {
  return updateBinding(targets, targetId, bindingId, (target, binding) => {
    if (!enabled) {
      return { ...binding, enabled: false };
    }
    const duplicate = hasEnabledGestureDuplicate(
      target.bindings,
      binding.id,
      binding.gesture,
    );
    return duplicate ? binding : { ...binding, enabled: true };
  });
}

export function replaceConflictingBindings(
  targets: Target[],
  targetId: string,
  bindingId: string,
): Target[] {
  return targets.map((target) => {
    if (target.id !== targetId) {
      return target;
    }
    const candidate = target.bindings.find((item) => item.id === bindingId);
    if (
      !candidate ||
      isGestureIncomplete(candidate.gesture) ||
      isActionIncomplete(candidate.action)
    ) {
      return target;
    }
    const conflictIds = new Set(
      findConflictingBindings(target.bindings, bindingId, candidate.gesture).map(
        (item) => item.id,
      ),
    );
    return {
      ...target,
      bindings: target.bindings.map((item) => {
        if (item.id === bindingId) return { ...item, enabled: true };
        if (conflictIds.has(item.id)) return { ...item, enabled: false };
        return item;
      }),
    };
  });
}

export function removeBinding(
  targets: Target[],
  targetId: string,
  bindingId: string,
): Target[] {
  return targets.map((target) =>
    target.id === targetId
      ? { ...target, bindings: target.bindings.filter((binding) => binding.id !== bindingId) }
      : target,
  );
}

export function addBinding(
  targets: Target[],
  targetId: string,
  binding: Binding,
): Target[] {
  return targets.map((target) =>
    target.id === targetId
      ? { ...target, bindings: [...target.bindings, binding] }
      : target,
  );
}

export function createEmptyBinding(): Binding {
  return {
    id: createId("binding"),
    enabled: false,
    gesture: { id: createId("gesture"), name: "", trigger: "R", steps: [] },
    action: { id: createId("action"), name: "", type: "keys", value: "" },
  };
}

export function addExecutable(
  targets: Target[],
  targetId: string,
  executable: string,
): Target[] {
  const normalized = executable.trim().toLowerCase();
  if (!normalized) {
    return targets;
  }
  return targets.map((target) => {
    if (target.id !== targetId) {
      return target;
    }
    const exists = target.executables.some(
      (item) => item.toLowerCase() === normalized,
    );
    return exists
      ? target
      : { ...target, executables: [...target.executables, normalized] };
  });
}

export function removeExecutable(
  targets: Target[],
  targetId: string,
  executable: string,
): Target[] {
  const normalized = executable.trim().toLowerCase();
  return targets.map((target) =>
    target.id === targetId
      ? {
          ...target,
          executables: target.executables.filter(
            (item) => item.toLowerCase() !== normalized,
          ),
        }
      : target,
  );
}

export function renameTarget(
  targets: Target[],
  targetId: string,
  name: string,
): Target[] {
  const trimmed = name.trim();
  if (!trimmed) {
    return targets;
  }
  return targets.map((target) =>
    target.id === targetId ? { ...target, name: trimmed } : target,
  );
}
