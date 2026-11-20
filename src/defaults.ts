import { AppConfig, Target } from "./types";

export const DEFAULT_TARGETS: Target[] = [
  // 1. 預設 (Global Default) - Placed at the top
  {
    id: "global",
    name: "預設",
    enabled: true,
    kind: "global",
    executables: [],
    bindings: [
      {
        id: "g-back",
        enabled: true,
        gesture: {
          id: "r-left",
          name: "上一頁",
          trigger: "R",
          steps: ["L"],
        },
        action: {
          id: "act-back",
          name: "上一頁 (Alt+Left)",
          type: "keys",
          value: "!{Left}",
        },
      },
      {
        id: "g-forward",
        enabled: true,
        gesture: {
          id: "r-right",
          name: "向右測試",
          trigger: "R",
          steps: ["R"],
        },
        action: {
          id: "act-hello",
          name: "彈出 Hello World (測試)",
          type: "ahk",
          value: 'MsgBox("Hello World!", "MouseGesture 5Btn")',
        },
      },
      {
        id: "g-close-tab",
        enabled: true,
        gesture: {
          id: "r-down-right",
          name: "關閉分頁",
          trigger: "R",
          steps: ["D", "R"],
        },
        action: {
          id: "act-close-tab",
          name: "關閉分頁 (Ctrl+W)",
          type: "keys",
          value: "^w",
        },
      },
      {
        id: "g-wheel-up",
        enabled: true,
        gesture: {
          id: "r-wheel-up",
          name: "右鍵滾輪上",
          trigger: "R",
          steps: ["WU"],
        },
        action: {
          id: "act-prev-tab",
          name: "切換上一分頁",
          type: "keys",
          value: "^{PgUp}",
        },
      },
      {
        id: "g-wheel-down",
        enabled: true,
        gesture: {
          id: "r-wheel-down",
          name: "右鍵滾輪下",
          trigger: "R",
          steps: ["WD"],
        },
        action: {
          id: "act-next-tab",
          name: "切換下一分頁",
          type: "keys",
          value: "^{PgDn}",
        },
      },
      {
        id: "g-corner-tl",
        enabled: true,
        gesture: {
          id: "corner-tl",
          name: "左上觸控角",
          trigger: "CornerTL",
          steps: [],
        },
        action: {
          id: "act-show-desktop",
          name: "顯示桌面 (Win+D)",
          type: "keys",
          value: "#d",
        },
      },
      {
        id: "g-edge-vol-up",
        enabled: true,
        gesture: {
          id: "edge-top-r-wu",
          name: "頂部右側音量增加",
          trigger: "EdgeTopR",
          steps: ["WU"],
        },
        action: {
          id: "act-vol-up",
          name: "提高音量",
          type: "keys",
          value: "{Volume_Up}",
        },
      },
      {
        id: "g-edge-vol-down",
        enabled: true,
        gesture: {
          id: "edge-top-r-wd",
          name: "頂部右側音量降低",
          trigger: "EdgeTopR",
          steps: ["WD"],
        },
        action: {
          id: "act-vol-down",
          name: "降低音量",
          type: "keys",
          value: "{Volume_Down}",
        },
      },
    ],
  },

  // 2. 特定程式 (Specific app groups)
  {
    id: "browsers",
    name: "瀏覽器群組",
    enabled: true,
    kind: "group",
    executables: ["chrome.exe", "msedge.exe", "firefox.exe", "brave.exe"],
    bindings: [
      {
        id: "b-close-tab",
        enabled: true,
        gesture: {
          id: "r-down-right",
          name: "右鍵向右下",
          trigger: "R",
          steps: ["D", "R"],
        },
        action: {
          id: "act-close-tab",
          name: "關閉分頁",
          type: "keys",
          value: "^w",
        },
      },
      {
        id: "b-reopen-tab",
        enabled: true,
        gesture: {
          id: "r-up-left",
          name: "右鍵向左上",
          trigger: "R",
          steps: ["U", "L"],
        },
        action: {
          id: "act-reopen-tab",
          name: "回復關閉分頁",
          type: "keys",
          value: "^+t",
        },
      },
    ],
  },

  // 3. 放行名單 (Disabled apps / Allowlist)
  {
    id: "disabled",
    name: "放行名單",
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
    { id: "r-left", name: "向左", trigger: "R", steps: ["L"] },
    { id: "r-right", name: "向右", trigger: "R", steps: ["R"] },
    { id: "r-up", name: "向上", trigger: "R", steps: ["U"] },
    { id: "r-down", name: "向下", trigger: "R", steps: ["D"] },
    { id: "r-down-right", name: "向右下", trigger: "R", steps: ["D", "R"] },
    { id: "r-up-left", name: "向左上", trigger: "R", steps: ["U", "L"] },
    { id: "x1-click", name: "側鍵 X1 單擊", trigger: "X1", steps: [] },
    { id: "x2-click", name: "側鍵 X2 單擊", trigger: "X2", steps: [] },
    { id: "r-wu", name: "右鍵滾輪上", trigger: "R", steps: ["WU"] },
    { id: "r-wd", name: "右鍵滾輪下", trigger: "R", steps: ["WD"] },
  ],
  actionTemplates: [
    { id: "act-back", name: "上一頁", type: "keys", value: "!{Left}" },
    { id: "act-forward", name: "下一頁", type: "keys", value: "!{Right}" },
    { id: "act-close-tab", name: "關閉分頁", type: "keys", value: "^w" },
    { id: "act-reopen-tab", name: "回復關閉分頁", type: "keys", value: "^+t" },
    { id: "act-prev-tab", name: "切換上一分頁", type: "keys", value: "^{PgUp}" },
    { id: "act-next-tab", name: "切換下一分頁", type: "keys", value: "^{PgDn}" },
    { id: "act-minimize", name: "最小化視窗", type: "ahk", value: "WinMinimize('A')" },
    { id: "act-show-desktop", name: "顯示桌面", type: "keys", value: "#d" },
    { id: "act-vol-up", name: "提高音量", type: "keys", value: "{Volume_Up}" },
    { id: "act-vol-down", name: "降低音量", type: "keys", value: "{Volume_Down}" },
  ],
  targets: DEFAULT_TARGETS,
};
