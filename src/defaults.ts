import { AppConfig, Target } from "./types";

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
        id: "g-close-tab",
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
        id: "g-wheel-up",
        enabled: true,
        gesture: {
          id: "r-wu",
          name: "Wheel Up",
          trigger: "R",
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
        id: "g-wheel-down",
        enabled: true,
        gesture: {
          id: "r-wd",
          name: "Wheel Down",
          trigger: "R",
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
        id: "g-corner-tl",
        enabled: true,
        gesture: {
          id: "corner-tl",
          name: "Top-Left Corner",
          trigger: "CornerTL",
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
        id: "g-edge-vol-up",
        enabled: true,
        gesture: {
          id: "edge-top-r-wu",
          name: "Top-Right Edge Wheel Up",
          trigger: "EdgeTopR",
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
        id: "g-edge-vol-down",
        enabled: true,
        gesture: {
          id: "edge-top-r-wd",
          name: "Top-Right Edge Wheel Down",
          trigger: "EdgeTopR",
          steps: ["WD"],
        },
        action: {
          id: "act-vol-down",
          name: "Volume Down",
          type: "keys",
          value: "{Volume_Down}",
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
    executables: ["photoshop.exe", "games.exe"],
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
  ],
  targets: DEFAULT_TARGETS,
};
