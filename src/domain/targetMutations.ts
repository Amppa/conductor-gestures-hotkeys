import { hasEnabledGestureDuplicate } from "./ruleValidation";
import { shouldEnableBinding } from "./bindingRules";
import { createId } from "../shared/ids";
import { Action, Binding, Gesture, Target } from "./types";

type BindingUpdater = (target: Target, binding: Binding) => Binding;

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
