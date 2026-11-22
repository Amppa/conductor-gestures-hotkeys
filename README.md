# Conductor

Conductor 是一套專為 Windows 11 打造的手勢與熱鍵指揮工具。它以 **Tauri 2 + React 19 + Fluent UI** 提供現代桌面介面，並由 **AutoHotkey v2** 引擎負責滑鼠手勢、鍵盤觸發與指令執行。

---

## 核心特性

- **現代 Windows 11 視覺**：採用微軟官方 `@fluentui/react-components` 打造的原生 Fluent Design 磨砂質感介面。
- **左側清晰導覽結構**：
  - **目標清單 (Targets)**：精確區分 `3. 黑名單 > 2. 特定程式群組 > 1. 全域` 檢查層級。
  - **手勢清單 (Gestures)**：管理觸發鍵（RB、MB、X1、X2）與向量方向步進。
  - **動作清單 (Actions)**：管理快速鍵、視窗控制與腳本動作。
  - **系統設定 (Settings)**：配置手勢閥值、螢幕邊緣滾動與開機自啟動。
- **多按鍵滑鼠支援**：支援滑鼠側鍵 `XButton1` (X1) 與 `XButton2` (X2) 作為獨立手勢觸發鍵或雙鍵修飾，產品定位不限定特定按鍵數量。
- **鍵盤觸發範本**：可定義需要攔截的按鍵與修飾鍵，再以值複製方式綁定到各應用範圍的規則。
- **右鍵狀態機與原生單擊無感還原**：按下右鍵位移小於閥值（預設 10px）放開時，精準發送原生物理右鍵點擊，不卡鍵、不影響常規右鍵選單。
- **8 方向向量辨識器**：以三角函數即時計算位移角度（上、下、左、右、四個斜向），反應速度小於 1ms。
- **螢幕頂部邊緣滾輪音量控制**：游標移動至螢幕最頂部邊緣時滾動滾輪，自動調節系統音量，重現 MouseInc 經典手感。
- **Windows 系統匣常駐與生命週期**：
  - 點擊視窗右上角「X」自動縮小至系統匣，不中斷背景手勢監聽。
  - 系統匣右鍵選單：「開啟設定」、「暫停/繼續手勢」、「開機自動啟動」、「結束程式」。
- **開箱即用**：內建隨附免安裝版 AutoHotkey v2 (`vendor/autohotkey/AutoHotkey64.exe`)，使用者點開即可運行，免額外安裝環境。

---

## 專案目錄結構

```text
conductor-gestures-hotkeys/
├── engine/
│   └── GestureEngine.ahk        # AHK v2 核心手勢引擎 (狀態機、8方向辨識、多按鍵勾點、頂部滾輪)
├── src-tauri/
│   ├── Cargo.toml               # Tauri 2 Rust 核心配置
│   ├── tauri.conf.json          # 視窗、系統匣、打包資源設定
│   └── src/
│       ├── main.rs              # Tauri 應用程式入口
│       └── lib.rs               # IPC 指令、系統匣、AHK 動態腳本生成與重載管道
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx          # 左側四項目導航 (目標、手勢、動作、設定)
│   │   └── Header.tsx           # 頂部狀態列與即時套用按鈕
│   ├── views/
│   │   ├── TargetsView.tsx      # 目標清單檢視 (3. 黑名單 > 2. 群組 > 1. 全域)
│   │   ├── GesturesView.tsx     # 手勢模板清單
│   │   ├── ActionsView.tsx      # 動作模板清單
│   │   └── SettingsView.tsx     # 系統與引擎設定 (邊緣滾輪、閥值、自啟)
│   ├── types.ts                 # 核心型別契約 (Config Schema)
│   ├── defaults.ts              # 開箱即用預設配置
│   ├── App.tsx                  # 主應用程式控制器
│   └── main.tsx                 # 前端進入點
├── vendor/
│   └── autohotkey/              # 隨附免安裝 AutoHotkey v2 執行階段
└── research/
    └── PROJECTS_ANALYSIS.md     # 6 大主流開源手勢專案深度技術剖析報告
```

---

## 開發與執行

### 1. 安裝相依套件
```bash
npm install
```

### 2. 啟動前端開發預覽
```bash
npm run dev
```

### 3. 啟動 Tauri 2 完整桌面應用
```bash
npm run tauri:dev
```

### 4. 編譯與建構發行包
```bash
npm run build
npm run tauri:build
```

---

## 目標比對優先級說明 (Priority Hierarchy)

當使用者在任意視窗劃出手勢時，後端依序比對：
1. **優先級 3 (黑名單 / Disabled)**：若命中黑名單程式（如 Photoshop、3D 遊戲），立即放行所有滑鼠事件，手勢完全不介入。
2. **優先級 2 (白名單群組 / Whitelist Groups)**：若命中白名單程式群組（如瀏覽器、CAD），優先套用該群組定義的專屬手勢（如向右下關閉分頁）。
3. **優先級 1 (全域預設 / Global Default)**：若未命中前兩者，自動套用全域通用手勢（如向左上一頁、向右下一頁、向下最小化視窗）。
