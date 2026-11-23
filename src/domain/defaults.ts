import { AppConfig, KeyRemap, Target } from "./types";

export const normalizeOsdDurationMs = (value: number): number =>
  Math.round(Math.min(Math.max(value, 0), 2000) / 500) * 500;

export const normalizeOsdFontSizePx = (value: number): number =>
  Math.round((Math.min(Math.max(value, 15), 25) - 15) / 5) * 5 + 15;

export const normalizeOsdOpacityPct = (value: number): number =>
  Math.round(Math.min(Math.max(value, 0), 100) / 10) * 10;

export const DEFAULT_KEY_REMAPS: KeyRemap[] = [
  {
    id: "remap-disable-insert",
    name: "停用 Insert 鍵 (靜音)",
    enabled: false,
    srcKey: "Insert",
    dstKey: "none",
  },
  {
    id: "remap-lalt-lwin",
    name: "左 Alt 映射為 Win",
    enabled: false,
    srcKey: "LAlt",
    dstKey: "LWin",
  },
  {
    id: "remap-lwin-lalt",
    name: "左 Win 映射為 Alt",
    enabled: false,
    srcKey: "LWin",
    dstKey: "LAlt",
  },
];

export const DEFAULT_TARGETS: Target[] = [
  // 1. Global Default
  {
    id: "global",
    name: "Global Default",
    enabled: true,
    kind: "global",
    executables: [],
    bindings: [
      {
        id: "g-back",
        enabled: true,
        gesture: {
          id: "r-left",
          name: "Left",
          trigger: "R",
          steps: ["L"],
        },
        action: {
          id: "act-back",
          name: "Back",
          type: "keys",
          value: "!{Left}",
        },
      },
      {
        id: "g-forward",
        enabled: true,
        gesture: {
          id: "r-right",
          name: "Right",
          trigger: "R",
          steps: ["R"],
        },
        action: {
          id: "act-forward",
          name: "Forward",
          type: "keys",
          value: "!{Right}",
        },
      },
      {
        id: "g-edge-left-vol-up",
        enabled: true,
        gesture: {
          id: "edge-left-wu",
          name: "Left Edge Wheel Up",
          trigger: "EdgeLeft",
          steps: ["WU"],
        },
        action: {
          id: "act-vol-up",
          name: "Volume Up",
          type: "keys",
          value: "{Volume_Up}",
        },
      },
      {
        id: "g-edge-left-vol-down",
        enabled: true,
        gesture: {
          id: "edge-left-wd",
          name: "Left Edge Wheel Down",
          trigger: "EdgeLeft",
          steps: ["WD"],
        },
        action: {
          id: "act-vol-down",
          name: "Volume Down",
          type: "keys",
          value: "{Volume_Down}",
        },
      },
      {
        id: "g-edge-top-prev-tab",
        enabled: true,
        gesture: {
          id: "edge-top-wu",
          name: "Top Edge Wheel Up",
          trigger: "EdgeTop",
          steps: ["WU"],
        },
        action: {
          id: "act-prev-tab",
          name: "Previous Tab",
          type: "keys",
          value: "^{PgUp}",
        },
      },
      {
        id: "g-edge-top-next-tab",
        enabled: true,
        gesture: {
          id: "edge-top-wd",
          name: "Top Edge Wheel Down",
          trigger: "EdgeTop",
          steps: ["WD"],
        },
        action: {
          id: "act-next-tab",
          name: "Next Tab",
          type: "keys",
          value: "^{PgDn}",
        },
      },
      {
        id: "g-corner-br",
        enabled: false,
        gesture: {
          id: "corner-br",
          name: "Bottom-Right Corner",
          trigger: "CornerBR",
          steps: [],
        },
        action: {
          id: "act-show-desktop",
          name: "Show Desktop",
          type: "keys",
          value: "#d",
        },
      },
      {
        id: "g-insert-mute",
        enabled: false,
        gesture: {
          id: "key-insert",
          name: "Insert",
          trigger: "Insert",
          steps: [],
        },
        action: {
          id: "act-noop",
          name: "No-op (Mute)",
          type: "noop",
          value: "",
        },
      },
    ],
  },

  // 2. Specific App Groups
  {
    id: "group01",
    name: "Group 01",
    enabled: true,
    kind: "group",
    executables: ["chrome.exe", "msedge.exe", "firefox.exe", "brave.exe"],
    bindings: [
      {
        id: "b-close-tab",
        enabled: true,
        gesture: {
          id: "r-down-right",
          name: "Down-Right",
          trigger: "R",
          steps: ["D", "R"],
        },
        action: {
          id: "act-close-tab",
          name: "Close Tab",
          type: "keys",
          value: "^w",
        },
      },
      {
        id: "b-reopen-tab",
        enabled: true,
        gesture: {
          id: "r-up-left",
          name: "Up-Left",
          trigger: "R",
          steps: ["U", "L"],
        },
        action: {
          id: "act-reopen-tab",
          name: "Reopen Closed Tab",
          type: "keys",
          value: "^+t",
        },
      },
    ],
  },

  // 3. Disabled List (Bypass)
  {
    id: "disabled",
    name: "Disabled List (Bypass)",
    enabled: true,
    kind: "disabled",
    executables: ["conductor.exe", "photoshop.exe"],
    bindings: [],
  },
];

export const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  language: "zh-TW",
  engine: {
    enabled: true,
    debug: false,
    thresholdPx: 10,
    osdDurationMs: 1000,
    osdFontSizePx: 20,
    osdOpacityPct: 90,
  },
  edgeScroll: {
    enabled: true,
    topEdge: true,
    action: "volume",
  },
  gestureTemplates: [
    { id: "r-left", name: "Left", trigger: "R", steps: ["L"] },
    { id: "r-right", name: "Right", trigger: "R", steps: ["R"] },
    { id: "r-up", name: "Up", trigger: "R", steps: ["U"] },
    { id: "r-down", name: "Down", trigger: "R", steps: ["D"] },
    { id: "r-down-right", name: "Down-Right", trigger: "R", steps: ["D", "R"] },
    { id: "r-up-left", name: "Up-Left", trigger: "R", steps: ["U", "L"] },
    { id: "x1-click", name: "X1 Click", trigger: "X1", steps: [] },
    { id: "x2-click", name: "X2 Click", trigger: "X2", steps: [] },
    { id: "r-wu", name: "R + Wheel Up", trigger: "R", steps: ["WU"] },
    { id: "r-wd", name: "R + Wheel Down", trigger: "R", steps: ["WD"] },
    { id: "corner-br", name: "Bottom-Right Corner", trigger: "CornerBR", steps: [] },
    { id: "key-insert", name: "Insert Key", trigger: "Insert", steps: [] },
    { id: "key-lalt", name: "Left Alt", trigger: "LAlt", steps: [] },
    { id: "key-lwin", name: "Left Win", trigger: "LWin", steps: [] },
  ],
  actionTemplates: [
    { id: "act-back", name: "Back", type: "keys", value: "!{Left}" },
    { id: "act-forward", name: "Forward", type: "keys", value: "!{Right}" },
    { id: "act-close-tab", name: "Close Tab", type: "keys", value: "^w" },
    { id: "act-reopen-tab", name: "Reopen Closed Tab", type: "keys", value: "^+t" },
    { id: "act-prev-tab", name: "Previous Tab", type: "keys", value: "^{PgUp}" },
    { id: "act-next-tab", name: "Next Tab", type: "keys", value: "^{PgDn}" },
    { id: "act-minimize", name: "Minimize Window", type: "ahk", value: "WinMinimize('A')" },
    { id: "act-show-desktop", name: "Show Desktop", type: "keys", value: "#d" },
    { id: "act-vol-up", name: "Volume Up", type: "keys", value: "{Volume_Up}" },
    { id: "act-vol-down", name: "Volume Down", type: "keys", value: "{Volume_Down}" },
    { id: "act-noop", name: "No-op (Mute)", type: "noop", value: "" },
    { id: "act-lwin", name: "Trigger Win", type: "remap", value: "LWin" },
    { id: "act-lalt", name: "Trigger Alt", type: "remap", value: "LAlt" },
  ],
  keyRemaps: DEFAULT_KEY_REMAPS,
  targets: DEFAULT_TARGETS,
};
