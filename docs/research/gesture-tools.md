# 外部開源滑鼠手勢專案分析報告 (Reference Projects Analysis)

本報告針對 `../ref/` 中的 6 個主流滑鼠手勢開源專案進行深入架構與技術剖析，評估其手勢識別演算法、滑鼠底層勾點 (Mouse Hook)、多鍵支援 (X1/X2)、螢幕邊緣觸發機制與介面技術棧，作為新世代滑鼠手勢專案的架構設計依據。

---

## 1. 專案橫向對比總覽 (Comparison Matrix)

| 專案名稱 | 語言 / 技術棧 | 架構模式 | 手勢識別機制 | 5 鍵 (X1/X2) 支援度 | 螢幕邊緣 / 角落滾動 | UI 介面與現代度 | 專案成熟度 / 維護現況 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GestureSign V2** | C# (.NET 10 + WinUI 3) | 雙進程 (Daemon 後台 + WinUI 3 前台) | 筆劃特徵點向量模板 ($P 衍生) + 本地 AI (ONNX) 意圖判斷 | 完整支援 (含多指觸控、TipTap) | 支援 (四邊滑動、點擊、桌面邊緣滾輪) | WinUI 3 Fluent / Mica / 深淺色主題 (極現代) | 高度活躍 (針對 Win 11 維護) |
| **mousetroke** | Rust + Tauri 2 (React UI) | 雙進程 (常駐 Rust 後台 ~19MB + 獨立 Tauri 設定頁) | 角度方向序列轉換 (U, D, L, R, ↗, 等) | 支援中鍵與自訂按鍵，側鍵整合中 | 完整支援 (四角 Hot Corners、頂部/邊緣滾動調音量/亮度) | Tauri 2 + React (極現代、極流暢) | 活躍開發中 (跨平台 Win/macOS) |
| **MouseGestureL (AHK)** | AutoHotkey (v1 / v2) | 單進程 (AHK 內部 Hook + 動態生成腳本) | 方向狀態機序列 (如 `RB_RD`, `X1B_U`) | 完整支援 5 鍵與任意雙鍵 Chord 組合 | 需透過自訂腳本判斷座標 | AHK 經典 Win32 原生控制項 (極舊極醜) | 穩定維護中 (歷時十餘年) |
| **MouseInc (Settings)** | 核心: C++ (閉源) / UI: Vue 2 + iView | 前後端分離 (原生 Daemon + Web 本機伺服器) | 向量方向編碼 | 完整支援 5 鍵與滾輪手勢 | 經典招牌功能 (四邊與四角滾輪調節音量/亮度/虛擬桌面) | Web SPA 現代介面 | UI 開源，核心閉源已停更 |
| **Stroke** | C# (.NET 4.8 + WinForms) | 雙進程 (無介面後台 + WinForms 設定器) | 方向向量距離比對 (支援任意連續曲線) + 運行時 C# 編譯 | 獨創 5 鍵位元遮罩 (`Key Trace` 0x01~0x10) | 無內建邊緣功能 (需自寫 C# 擴充) | WinForms 傳統視窗 (實用但老舊) | 個人維護，設計純粹 |
| **WGestures** | C# (.NET 3.5 + WPF) | 單進程 (WPF + WindowsInput API) | 幾何方向向量比對 + 即時提示泡泡 (Bubble) | 主要支援右鍵，修飾鍵組合 | 無專用邊緣滾輪 | WPF Metro 風格 (動態提示很棒) | 已多年停止維護 |

---

## 2. 個別專案深度剖析 (Deep Dive)

### 2.1 GestureSign V2
- **程式碼目錄**: `../ref/GestureSignv2`
- **技術棧**: C# 12, .NET 10, Windows App SDK, WinUI 3, ManagedWinapi
- **核心架構**:
  - `GestureSign.Daemon`: 專門處理底層 Hook 的守護進程，避免 UI 渲染阻塞低階勾點 (`WH_MOUSE_LL` / `WH_KEYBOARD_LL`)。
  - `GestureSign.WinUI`: 採用 WinUI 3 打造的高質感設定介面，支援 Mica、深淺色切換及 Xbox/掌機大螢幕模式。
- **亮點與借鑒點**:
  - 邊緣互動 (`Edge Interaction`): 能夠分別在螢幕四邊設定「邊緣點擊」與「邊緣滑動」，並可根據當前啟用視窗進行 App-specific 優先匹配。
  - 豐富的命令整合: 內建瀏覽器控制、視窗管理、音量調節、腳本執行 (PowerShell, Python, AHK)。
- **缺點 / 挑戰**:
  - 依賴龐大: 需要 .NET 10 與 Windows App SDK 執行階段，安裝包與記憶體開銷較高。
  - 專案架構過於龐大複雜，若是個人滑鼠專案，初期難以快速迭代維護。

---

### 2.2 mousetroke
- **程式碼目錄**: `../ref/mousetroke`
- **技術棧**: Rust (stable), Tauri 2, React, TypeScript, Microsoft Edge WebView2
- **核心架構**:
  - `crates/mousetroke-core`: 平台無關的純邏輯，包含組態定義 (Config Schema)、軌跡辨識器 (Recognizer)、快速鍵解析。
  - `crates/mousetroke-win`: Windows 平台專屬層，負責 `WH_MOUSE_LL` 低階勾點、Direct2D 軌跡繪製 (`overlay.rs`)、`SendInput` 輸入模擬、Tray 系統匣。
  - `crates/mousetroke-settings`: 獨立 Tauri 2 前端，僅在使用者點擊設定時開啟，設定完關閉即釋放記憶體。
- **亮點與借鑒點**:
  - **極致的記憶體與效能控制**: 常駐後台僅約 19MB，安裝檔僅 13MB。
  - **螢幕邊緣滾動原生實作**: 在 `input.rs` 與 `preset_actions.rs` 中，當滑鼠座標落在螢幕最上方邊界時滾動滾輪，直接調用 Windows CoreAudio API 調整音量，或透過 DDC/CI 調整外接螢幕亮度。
  - **Lua 腳本擴充**: 兼顧了安全性與靈活性。
- **缺點 / 挑戰**:
  - 需掌握 Rust 底層 Win32 API 交互與非同步狀態機。

---

### 2.3 MouseGestureL (AHK)
- **程式碼目錄**: `../ref/MouseGestureL`
- **技術棧**: AutoHotkey v1 / v2, Win32 GUI, GDI+
- **核心架構**:
  - 純 AHK 腳本驅動，透過 `SetWindowsHookEx` 或 AHK 內建的 Hotkey / Mouse Hook 機制攔截輸入。
  - 透過 `MG_Edit.ahk` 與配置資料庫動態產生目標腳本並即時 Reload。
- **亮點與借鑒點**:
  - **5 鍵與雙鍵組合 (Chord Gestures) 的極致靈活性**: 支援 `RB_LB` (按住右鍵按左鍵)、`X1B_WheelUp` (按住側鍵滾輪上)、`X2B_R` (按住側鍵向右劃) 等任意組合。
  - **即時動作提示 (Gesture Hints)**: 在輸入手勢的過程中，在游標旁即時顯示當前手勢可匹配的候選清單。
  - **與 Windows 深度整合的腳本能力**: AHK 原生處理視窗切換、按鍵發送、剪貼簿的語法非常簡潔強大。
- **缺點 / 挑戰**:
  - **介面陳舊、體驗極差**: AHK 原生 Win32 GUI 介面極度繁複且視覺老舊，設定門檻高，缺乏現代互動體驗。

---

### 2.4 MouseInc
- **程式碼目錄**: `../ref/MouseInc.Settings-2.13.2`
- **技術棧**: 後端 C++ (原生單一檔案), 前端 Vue 2 + iView-admin
- **核心架構**:
  - 前後端分離經典範例：本機常駐一個極簡 C++ 伺服器，介面完全由 Web SPA 呈現。
- **亮點與借鑒點**:
  - **經典的螢幕邊緣滾輪**: 將游標移至螢幕頂部邊緣滾動滾輪調節系統音量、游標移至螢幕角落觸發開始功能表或切換桌面，手感極佳。
  - **極簡安裝體驗**: 無需安裝龐大環境，點開即用。
- **缺點 / 挑戰**:
  - 核心程式碼未開源，無法直接客製核心演算法。

---

### 2.5 Stroke
- **程式碼目錄**: `../ref/Stroke`
- **技術棧**: C# (.NET Framework 4.8), WinForms, Roslyn 動態編譯
- **核心架構**:
  - `Stroke.exe`: 無 UI 後台，開機常駐。
  - `Stroke.Configure.exe`: 設定編輯器。
  - 獨創概念：**按鍵痕跡 (Key Trace Bitmask)**。
- **亮點與借鑒點**:
  - 5 個標準按鍵的位元遮罩編碼：
    - Left: `0x00000001`
    - Right: `0x00000002`
    - XButton1: `0x00000004`
    - XButton2: `0x00000008`
    - Middle: `0x00000010`
  - 任何手勢在劃動過程中按下其他鍵，會以位元組合傳入動作邏輯，實作簡潔优雅。
  - 動作可執行任意 C# 程式碼，具有最高效能與無限擴展性。
- **缺點 / 挑戰**:
  - WinForms 介面不夠現代，且每次修改設定後啟動需重新編譯腳本。

---

## 3. 關鍵技術機制實作分析 (Core Mechanics)

### 3.1 滑鼠低階勾點與右鍵處理 (Low-Level Mouse Hook)
- **問題**: 滑鼠右鍵既要當作手勢觸發鍵 (Trigger Key)，又不能破壞常規單擊彈出右鍵選單 (Context Menu)。
- **標準解法 (參考 mousetroke 與 Stroke)**:
  1. 監聽 `WM_RBUTTONDOWN`: 攔截該訊息 (`return 1`)，記錄起始點座標 `(startX, startY)`，進入 `Pending` 狀態。
  2. 監聽 `WM_MOUSEMOVE`: 若處於 `Pending` 狀態，計算移動距離 $\Delta = \sqrt{(x - x_0)^2 + (y - y_0)^2}$。
     - 若 $\Delta > \text{Threshold}$ (通常為 8~12 像素)，切換為 `Drawing` (手勢劃動) 狀態，開始記錄軌跡並在螢幕繪製線條。
  3. 監聽 `WM_RBUTTONUP`:
     - 若仍為 `Pending` 狀態 (未達到位移門檻): 判定為普通單擊，透過 `SendInput` 模擬還原一次無手勢的 `WM_RBUTTONDOWN` + `WM_RBUTTONUP`，確保右鍵選單正常彈出。
     - 若為 `Drawing` 狀態: 結束繪圖，執行手勢匹配演算法並觸發對應動作，攔截訊息不外漏。

### 3.2 側鍵 X1 / X2 與 5 鍵支援
- **底層處理**:
  - 攔截 `WM_XBUTTONDOWN` 與 `WM_XBUTTONUP`。
  - 透過 `HIWORD(wParam)` 判斷具體按鍵：
    - `XBUTTON1` (`0x0001`): 通常為瀏覽器上一頁 (Back)。
    - `XBUTTON2` (`0x0002`): 通常為瀏覽器下一頁 (Forward)。
- **支援模式**:
  1. **作為手勢觸發鍵**: 按住 X1/X2 劃動滑鼠觸發專屬手勢。
  2. **作為修飾鍵 (Chord Click)**: 按住右鍵時按 X1/X2，或按住 X1 時滾動滾輪。
  3. **直接取代/對應 (Remapping)**: 將 X1/X2 映射為自訂快速鍵或媒體控制。

### 3.3 螢幕邊緣滾動 (Screen Edge Scrolling)
- **底層機制**:
  - 監聽 `WM_MOUSEWHEEL`。
  - 取得當前滑鼠座標 `(x, y)`，檢查是否滿足邊界條件：
    - 頂部邊界: `y <= 1` (或 `y == 0`)。
    - 底部邊界: `y >= ScreenHeight - 2`。
    - 左/右側邊界: `x == 0` 或 `x >= ScreenWidth - 2`。
  - 若命中邊緣: 攔截滾輪事件，呼叫系統 CoreAudio API 遞增/遞減音量，或切換視窗/分頁，不讓滾輪滾動到底層視窗。

---

## 4. 推薦技術選型與架構規劃

綜合評估需求 (包含右鍵、X1/X2、邊緣滾動、快速鍵取代，且要求介面現代美觀、輕量高效)，推薦以下兩種最佳路徑：

### 推薦方案 A：Tauri 2 + Rust 核心 (推薦首選)
- **架構模式**: 參考 `mousetroke` 的前後端分離架構。
  - **後端 (Core Engine)**: Rust 輕量常駐，專門負責 `WH_MOUSE_LL` 勾點、手勢狀態機、邊緣偵測與 `SendInput`。記憶體佔用極低 (<20MB)，開機秒啟動。
  - **前端 (Settings UI)**: Tauri 2 + React / Vue 3 + Tailwind CSS / Fluent UI。可做出宛如 Windows 11 原生系統設定的精美磨砂圓角介面。只有在點開設定時載入 Webview，關閉後完全不佔記憶體。
- **優勢**: 兼具現代美觀與極致效能，無巨大 Runtime 依賴。

### 推薦方案 B：Tauri 2 前端 + AutoHotkey v2 核心 (兼顧現有習慣與絕佳擴展性)
- **架構模式**: 沿用使用者熟悉的 AHK 邏輯，但徹底換上現代 Web 外殼。
  - **後端 (Core Engine)**: Headless AutoHotkey v2 進程 (直接將 `AutoHotkey64.exe` 嵌入專案)，負責處理 5 鍵勾點與執行 AHK 動作。
  - **前端 (Settings UI)**: Tauri 2 前端，讀寫 JSON 設定檔，自動轉譯或產生 AHK 設定並觸發 Reload。
- **優勢**: AHK 針對鍵盤快速鍵取代、視窗操控的語法最簡單直覺，使用者容易自行添加腳本。

---
*分析報告已歸檔至 `docs/research/gesture-tools.md`。*
