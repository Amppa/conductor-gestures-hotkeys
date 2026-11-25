# DEVELOPMENT.md - RD Workflow & Guidelines

> Note: Sections 1-3 are project-agnostic engineering standards reusable across any project.

## 1. Core Principles
- **Agile**: 1 atomic change at a time. State pros, impact, and side effects.
- **Ambiguity**: Do not guess. Present 2-3 options with pros/cons (`Decision 1/2/3`).
- **Code Style**: Google/Java style, CamelCase (TS) / snake_case (Rust/AHK). Concise naming (`cnt`, `msg`, `del`, `getState()`). English comments on complex logic only.

## 2. Git & Commit Protocol
- **Branches**: `feat/*`, `fix/*`, `refactor/*`, `docs/*`, `test/*`. Never commit directly to `main`.
- **Commits**: Conventional Commits in English (1-3 lines):
  `<type>(<scope>): <concise subject>`
- **Workflow**: Create branch -> Test & Verify -> Commit -> Merge to main.

## 3. Communication Standards
- Traditional Chinese (繁體中文), strictly NO EMOJIS, enthusiastic & technical tone.
- Command execution: User executes shell commands; AI performs read-only checks only.

## 4. CLI Toolchain & Quality Gates (Project-Specific)
```bash
# Quality Gates (Must 100% pass before merge)
npm run verify                                     # Run all gates below
npm run test:engine                                # Gate 1: AHK engine suite (engine/tests, runs in temp dir)
npm run test:i18n                                  # Gate 2: Translation key validation
npm run build                                      # Gate 3: Frontend TS build
npm run test:rust                                  # Gate 4: Rust unit and doc tests
npm run check:rust                                 # Gate 5: Rust compilation check

# Local Dev
npm run dev                                        # UI-only fast dev (Vite HMR)
npm run tauri:dev                                  # Full desktop dev
```
## 建置免安裝版

日常更新固定位置的免安裝版時，在專案根目錄執行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/rebuild-portable.ps1
```

腳本會關閉該份 Conductor 與其 AHK，引擎建置與打包完成後會從
`release\Conductor-portable\Conductor.exe` 啟動新版。原有 `data` 會沿用，
舊版資料夾保留在 `release\previous-*`，ZIP 以乾淨設定打包。

加上 `-EnableStartup` 可建立目前使用者的 Windows 登入啟動捷徑。
加上 `-ConfigPath "D:\backup\config.json"` 可指定要帶入新版的設定檔。

在專案根目錄執行以下指令，即可使用目前的程式碼和版本建置 `release\Conductor-portable.zip`。

```powershell
npm run package:portable
```

如果 `src-tauri\target\release\conductor.exe` 已經建好，可直接打包。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/package-portable.ps1
```

若 `release\Conductor-portable` 或同名 ZIP 已存在，請先移動或重新命名舊產物。已使用過的免安裝版可保留資料夾內的 `data` 設定。
