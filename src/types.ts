export type Language = "zh-TW" | "en";

// Target evaluation priority: 3. disabled > 2. group > 1. global
export type TargetKind = "disabled" | "group" | "global";

export type GestureTrigger =
  | "R"
  | "M"
  | "L"
  | "X1"
  | "X2"
  | "CornerTL"
  | "CornerTR"
  | "CornerBL"
  | "CornerBR"
  | "EdgeTop"
  | "EdgeBottom"
  | "EdgeLeft"
  | "EdgeRight";

export type ActionType = "keys" | "mouse" | "wheel" | "run" | "ahk";

export interface Gesture {
  id: string;
  name: string;
  trigger: GestureTrigger;
  steps: string[];
}

export interface Action {
  id: string;
  name: string;
  type: ActionType;
  value: string;
}

export interface Binding {
  id: string;
  enabled: boolean;
  gesture: Gesture;
  action: Action;
}

export interface Target {
  id: string;
  name: string;
  enabled: boolean;
  kind: TargetKind;
  executables: string[];
  bindings: Binding[];
}

export interface EdgeScrollConfig {
  enabled: boolean;
  topEdge: boolean;
  action: "volume" | "switch-tab" | "custom";
}

export interface EngineConfig {
  enabled: boolean;
  debug: boolean;
  thresholdPx: number;
}

export interface AppConfig {
  version: number;
  language: Language;
  engine: EngineConfig;
  edgeScroll: EdgeScrollConfig;
  gestureTemplates: Gesture[];
  actionTemplates: Action[];
  targets: Target[];
}

export interface RuntimeStatus {
  state: "stopped" | "running" | "error";
  appliedRevision: number | null;
  msg: string;
}
