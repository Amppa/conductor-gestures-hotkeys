import { AppConfig, KeyRemap, Target } from "./types";

export const normalizeOsdDurationMs = (value: number): number =>
  Math.round(Math.min(Math.max(value, 0), 2000) / 500) * 500;

export const normalizeOsdFontSizePx = (value: number): number =>
  Math.round((Math.min(Math.max(value, 15), 25) - 15) / 5) * 5 + 15;

export const normalizeOsdOpacityPct = (value: number): number =>
  Math.round(Math.min(Math.max(value, 0), 100) / 10) * 10;

export const normalizeDoubleTapMs = (value: number): number =>
  Math.round((Math.min(Math.max(value, 150), 500) - 150) / 50) * 50 + 150;

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
        id: "g-corner-br",
        enabled: false,
        gesture: {
          id: "corner-br",
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
      {
        id: "g-r-wu-scroll-3x",
        enabled: true,
        gesture: {
          id: "r-wu",
          trigger: "R",
          steps: ["WU"],
        },
        action: {
          id: "act-scroll-up-3x",
          name: "Scroll Up 3x",
          type: "keys",
          value: "{WheelUp 3}",
        },
      },
      {
        id: "g-r-wd-scroll-3x",
        enabled: true,
        gesture: {
          id: "r-wd",
          trigger: "R",
          steps: ["WD"],
        },
        action: {
          id: "act-scroll-down-3x",
          name: "Scroll Down 3x",
          type: "keys",
          value: "{WheelDown 3}",
        },
      },
      {
        id: "g-page-top",
        enabled: true,
        gesture: {
          id: "r-up",
          trigger: "R",
          steps: ["U"],
        },
        action: {
          id: "act-page-top",
          name: "Go to Top",
          type: "keys",
          value: "^{Home}",
        },
      },
      {
        id: "g-page-bottom",
        enabled: true,
        gesture: {
          id: "r-down",
          trigger: "R",
          steps: ["D"],
        },
        action: {
          id: "act-page-bottom",
          name: "Go to Bottom",
          type: "keys",
          value: "^{End}",
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
          id: "r-right-down",
          trigger: "R",
          steps: ["R", "D"],
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
          id: "r-right-up",
          trigger: "R",
          steps: ["R", "U"],
        },
        action: {
          id: "act-reopen-tab",
          name: "Reopen Closed Tab",
          type: "keys",
          value: "^+t",
        },
      },
      {
        id: "g-edge-top-prev-tab",
        enabled: true,
        gesture: {
          id: "edge-top-wu",
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
        id: "b-edge-top-left-video-speed-up",
        enabled: false,
        gesture: {
          id: "edge-top-left-wu",
          trigger: "EdgeTopLeftHalf",
          steps: ["WU"],
        },
        action: {
          id: "act-video-speed-up",
          name: "Video Speed Up",
          type: "keys",
          value: "+{.}",
        },
      },
      {
        id: "b-edge-top-left-video-speed-down",
        enabled: false,
        gesture: {
          id: "edge-top-left-wd",
          trigger: "EdgeTopLeftHalf",
          steps: ["WD"],
        },
        action: {
          id: "act-video-speed-down",
          name: "Video Speed Down",
          type: "keys",
          value: "+{,}",
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
    doubleTapMs: 300,
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
    { id: "edge-top-wu", trigger: "EdgeTop", steps: ["WU"] },
    { id: "edge-top-wd", trigger: "EdgeTop", steps: ["WD"] },
    { id: "edge-bottom-wu", trigger: "EdgeBottom", steps: ["WU"] },
    { id: "edge-bottom-wd", trigger: "EdgeBottom", steps: ["WD"] },
    { id: "edge-left-wu", trigger: "EdgeLeft", steps: ["WU"] },
    { id: "edge-left-wd", trigger: "EdgeLeft", steps: ["WD"] },
    { id: "edge-right-wu", trigger: "EdgeRight", steps: ["WU"] },
    { id: "edge-right-wd", trigger: "EdgeRight", steps: ["WD"] },
    { id: "edge-top-left-wu", trigger: "EdgeTopLeftHalf", steps: ["WU"] },
    { id: "edge-top-left-wd", trigger: "EdgeTopLeftHalf", steps: ["WD"] },
    { id: "edge-top-right-wu", trigger: "EdgeTopRightHalf", steps: ["WU"] },
    { id: "edge-top-right-wd", trigger: "EdgeTopRightHalf", steps: ["WD"] },
    { id: "edge-bottom-left-wu", trigger: "EdgeBottomLeftHalf", steps: ["WU"] },
    { id: "edge-bottom-left-wd", trigger: "EdgeBottomLeftHalf", steps: ["WD"] },
    { id: "edge-bottom-right-wu", trigger: "EdgeBottomRightHalf", steps: ["WU"] },
    { id: "edge-bottom-right-wd", trigger: "EdgeBottomRightHalf", steps: ["WD"] },
    { id: "edge-left-top-wu", trigger: "EdgeLeftTopHalf", steps: ["WU"] },
    { id: "edge-left-top-wd", trigger: "EdgeLeftTopHalf", steps: ["WD"] },
    { id: "edge-left-bottom-wu", trigger: "EdgeLeftBottomHalf", steps: ["WU"] },
    { id: "edge-left-bottom-wd", trigger: "EdgeLeftBottomHalf", steps: ["WD"] },
    { id: "edge-right-top-wu", trigger: "EdgeRightTopHalf", steps: ["WU"] },
    { id: "edge-right-top-wd", trigger: "EdgeRightTopHalf", steps: ["WD"] },
    { id: "edge-right-bottom-wu", trigger: "EdgeRightBottomHalf", steps: ["WU"] },
    { id: "edge-right-bottom-wd", trigger: "EdgeRightBottomHalf", steps: ["WD"] },
    { id: "corner-tl", trigger: "CornerTL", steps: [] },
    { id: "corner-tr", trigger: "CornerTR", steps: [] },
    { id: "corner-bl", trigger: "CornerBL", steps: [] },
    { id: "r-diagonal-ul", trigger: "R", steps: ["UL"] },
    { id: "r-diagonal-ur", trigger: "R", steps: ["UR"] },
    { id: "r-diagonal-dr", trigger: "R", steps: ["DR"] },
    { id: "r-diagonal-dl", trigger: "R", steps: ["DL"] },
    { id: "r-left", trigger: "R", steps: ["L"] },
    { id: "r-right", trigger: "R", steps: ["R"] },
    { id: "r-up", trigger: "R", steps: ["U"] },
    { id: "r-down", trigger: "R", steps: ["D"] },
    { id: "r-right-down", trigger: "R", steps: ["R", "D"] },
    { id: "r-right-up", trigger: "R", steps: ["R", "U"] },
    { id: "r-left-down", trigger: "R", steps: ["L", "D"] },
    { id: "r-left-up", trigger: "R", steps: ["L", "U"] },
    { id: "x1-click", trigger: "X1", steps: [] },
    { id: "x2-click", trigger: "X2", steps: [] },
    { id: "r-x2-click", trigger: "R+X2", steps: [] },
    { id: "r-x1-click", trigger: "R+X1", steps: [] },
    { id: "r-wu", trigger: "R", steps: ["WU"] },
    { id: "r-wd", trigger: "R", steps: ["WD"] },
    { id: "corner-br", trigger: "CornerBR", steps: [] },
    { id: "key-lctrl-2x", trigger: "LCtrl*2", steps: [] },
    { id: "key-insert", trigger: "Insert", steps: [] },
    { id: "key-numlock", trigger: "NumLock", steps: [] },
    { id: "key-numpad0", trigger: "Numpad0", steps: [] },
    { id: "key-numpad1", trigger: "Numpad1", steps: [] },
    { id: "key-numpad2", trigger: "Numpad2", steps: [] },
    { id: "key-numpad3", trigger: "Numpad3", steps: [] },
    { id: "key-numpad4", trigger: "Numpad4", steps: [] },
    { id: "key-numpad5", trigger: "Numpad5", steps: [] },
    { id: "key-numpad6", trigger: "Numpad6", steps: [] },
    { id: "key-numpad7", trigger: "Numpad7", steps: [] },
    { id: "key-numpad8", trigger: "Numpad8", steps: [] },
    { id: "key-numpad9", trigger: "Numpad9", steps: [] },
    { id: "key-numpad-div", trigger: "NumpadDiv", steps: [] },
    { id: "key-numpad-mult", trigger: "NumpadMult", steps: [] },
    { id: "key-numpad-sub", trigger: "NumpadSub", steps: [] },
    { id: "key-numpad-add", trigger: "NumpadAdd", steps: [] },
    { id: "key-numpad-dot", trigger: "NumpadDot", steps: [] },
    { id: "key-numpad-enter", trigger: "NumpadEnter", steps: [] },
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
    { id: "act-paste-plain", name: "Paste Plain Text", type: "keys", value: "^+v" },
    { id: "act-select-line", name: "Select Line", type: "ahk", value: "Send('{Home}+{End}')" },
    { id: "act-delete-confirm", name: "Delete & Confirm", type: "ahk", value: "Send('{Delete}')\nSleep(150)\nSend('y')" },
    { id: "act-page-top", name: "Go to Top", type: "keys", value: "^{Home}" },
    { id: "act-page-bottom", name: "Go to Bottom", type: "keys", value: "^{End}" },
    { id: "act-scroll-up-3x", name: "Scroll Up 3x", type: "keys", value: "{WheelUp 3}" },
    { id: "act-scroll-down-3x", name: "Scroll Down 3x", type: "keys", value: "{WheelDown 3}" },
    { id: "act-video-speed-up", name: "Video Speed Up", type: "keys", value: "+{.}" },
    { id: "act-video-speed-down", name: "Video Speed Down", type: "keys", value: "+{,}" },
    { id: "act-mute", name: "Toggle Mute", type: "keys", value: "{Volume_Mute}" },
    { id: "act-play-pause", name: "Play / Pause", type: "keys", value: "{Media_Play_Pause}" },
    { id: "act-media-prev", name: "Previous Track", type: "keys", value: "{Media_Prev}" },
    { id: "act-media-next", name: "Next Track", type: "keys", value: "{Media_Next}" },
    { id: "act-screenshot-region", name: "Region Screenshot", type: "keys", value: "#+s" },
    { id: "act-switch-ime", name: "Switch Input Method", type: "keys", value: "#{Space}" },
    { id: "act-toggle-ime", name: "Toggle IME (Ctrl+Space)", type: "keys", value: "^{Space}" },
    { id: "act-open-calc", name: "Open Calculator", type: "run", value: "calc.exe" },
    { id: "act-open-notepad", name: "Open Notepad", type: "run", value: "notepad.exe" },
    { id: "act-hello", name: "Show Hello Dialog", type: "ahk", value: "MsgBox('Hello', 'Conductor', 'AlwaysOnTop')" },
  ],
  keyRemaps: DEFAULT_KEY_REMAPS,
  targets: DEFAULT_TARGETS,
};
