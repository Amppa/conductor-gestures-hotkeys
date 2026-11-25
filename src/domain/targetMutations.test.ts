import { describe, expect, it } from "vitest";
import {
  addBinding,
  moveBinding,
  addExecutable,
  createEmptyBinding,
  removeBinding,
  removeExecutable,
  renameTarget,
  replaceBindingAction,
  replaceBindingGesture,
  setBindingEnabled,
} from "./targetMutations";
import { Action, Binding, Gesture, Target } from "./types";

const leftGesture: Gesture = { id: "g-left", name: "Left", trigger: "R", steps: ["L"] };
const rightGesture: Gesture = { id: "g-right", name: "Right", trigger: "R", steps: ["R"] };
const keysAction: Action = { id: "a-keys", name: "Keys", type: "keys", value: "^w" };
const noopAction: Action = { id: "act-noop", name: "No-op", type: "noop", value: "" };

function binding(id: string, enabled: boolean, gesture: Gesture, action: Action): Binding {
  return { id, enabled, gesture, action };
}

function targets(bindings: Binding[] = []): Target[] {
  return [
    {
      id: "global",
      name: "Global",
      enabled: true,
      kind: "global",
      executables: ["chrome.exe"],
      bindings,
    },
  ];
}

describe("binding mutations", () => {
  it("moves a rule across scopes and disables conflicting enabled triggers", () => {
    const source = binding("source", true, leftGesture, keysAction);
    const existing = binding("existing", true, leftGesture, noopAction);
    const original = targets([source]);
    original.push({ ...original[0], id: "group", kind: "group", bindings: [existing] });
    const result = moveBinding(original, "global", "group", "source");
    expect(result.conflict).toBe(true);
    expect(result.targets[0].bindings).toEqual([]);
    expect(result.targets[1].bindings.map((item) => item.id)).toEqual(["existing", "source"]);
    expect(result.targets[1].bindings[1].enabled).toBe(false);
    expect(source.enabled).toBe(true);
    expect(original[0].bindings).toHaveLength(1);
  });

  it("reorders within a scope without disabling the moved rule", () => {
    const first = binding("first", true, leftGesture, keysAction);
    const second = binding("second", false, rightGesture, noopAction);
    const result = moveBinding(targets([first, second]), "global", "global", "first", "second", true);
    expect(result.targets[0].bindings).toEqual([second, first]);
    expect(result.conflict).toBe(false);
  });
  it("enables a complete gesture replacement", () => {
    const original = targets([binding("b1", false, leftGesture, keysAction)]);
    const updated = replaceBindingGesture(original, "global", "b1", rightGesture);

    expect(updated[0].bindings[0].gesture).toEqual(rightGesture);
    expect(updated[0].bindings[0].enabled).toBe(true);
    expect(original[0].bindings[0].gesture).toEqual(leftGesture);
  });

  it("disables a gesture replacement that duplicates an enabled rule", () => {
    const original = targets([
      binding("b1", true, leftGesture, keysAction),
      binding("b2", true, rightGesture, keysAction),
    ]);
    const updated = replaceBindingGesture(original, "global", "b2", leftGesture);

    expect(updated[0].bindings[1].enabled).toBe(false);
  });

  it("enables an action replacement when the gesture is complete", () => {
    const original = targets([
      binding("b1", false, leftGesture, { ...keysAction, value: "" }),
    ]);
    const updated = replaceBindingAction(original, "global", "b1", noopAction);

    expect(updated[0].bindings[0].action).toEqual(noopAction);
    expect(updated[0].bindings[0].enabled).toBe(true);
  });

  it("refuses to enable a duplicate binding", () => {
    const original = targets([
      binding("b1", true, leftGesture, keysAction),
      binding("b2", false, leftGesture, keysAction),
    ]);
    const updated = setBindingEnabled(original, "global", "b2", true);

    expect(updated[0].bindings[1].enabled).toBe(false);
  });

  it("adds and removes bindings without mutating the input", () => {
    const original = targets();
    const added = addBinding(original, "global", binding("b1", false, leftGesture, keysAction));
    const removed = removeBinding(added, "global", "b1");

    expect(original[0].bindings).toHaveLength(0);
    expect(added[0].bindings).toHaveLength(1);
    expect(removed[0].bindings).toHaveLength(0);
  });
});

describe("executable mutations", () => {
  it("adds executables case-insensitively without duplicates", () => {
    const original = targets();
    const added = addExecutable(original, "global", "Chrome.EXE");
    const duplicate = addExecutable(added, "global", "chrome.exe");

    expect(added[0].executables).toEqual(["chrome.exe"]);
    expect(duplicate[0].executables).toEqual(["chrome.exe"]);
  });

  it("removes executables case-insensitively", () => {
    const original = targets();
    const removed = removeExecutable(original, "global", "CHROME.EXE");

    expect(removed[0].executables).toEqual([]);
  });
});

describe("target mutations", () => {
  it("renames a target with a trimmed name and ignores blank names", () => {
    const original = targets();

    expect(renameTarget(original, "global", "  Work  ")[0].name).toBe("Work");
    expect(renameTarget(original, "global", "   ")[0].name).toBe("Global");
  });
});

describe("createEmptyBinding", () => {
  it("creates unique identifiers for rapid creation", () => {
    const first = createEmptyBinding();
    const second = createEmptyBinding();

    expect(first.id).not.toBe(second.id);
    expect(first.gesture.id).not.toBe(second.gesture.id);
    expect(first.action.id).not.toBe(second.action.id);
  });
});
