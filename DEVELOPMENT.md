# DEVELOPMENT.md - Architecture, Specification & Commands Guide

This document outlines the system architecture, target hierarchy, gesture notation rules, project directory structure, and essential developer CLI commands for `Mouse-gesture-5btn`.

---

## 1. Project Goal & Overview

`Mouse-gesture-5btn` is a next-generation Windows mouse gesture utility designed to replace legacy tools like MouseGestureL (MGL). It pairs a modern Windows 11 Fluent UI frontend (Tauri 2 + React 19) with an AutoHotkey v2 core engine, providing native 5-button mouse support, screen edge scrolling, hot corners, and real-time on-screen display (OSD).

---

## 2. Core Features & Capabilities

1. **5-Button Mouse & Chords**:
   - Primary gesture triggers: `R` (Right Button), `M` (Middle Button), `L` (Left Button), `X1` (Side Button 1), `X2` (Side Button 2).
   - Chord Continuous Wheel: Holding a trigger button and scrolling the wheel (`R + W↑`, `R + W↓`, `X1 + W↑`) fires continuously without waiting for button release, suppressing native clicks.
2. **Screen Spatial Triggers**:
   - **Hot Corners (Highest Priority)**: `CornerTL` (Top-Left), `CornerTR` (Top-Right), `CornerBL` (Bottom-Left), `CornerBR` (Bottom-Right).
   - **Split Screen Edges**:
     - `EdgeTopL`: Top edge left half (x < ScreenWidth / 2).
     - `EdgeTopR`: Top edge right half (x >= ScreenWidth / 2, default volume control).
     - `EdgeLeft`, `EdgeRight`, `EdgeBottomL`, `EdgeBottomR`.
3. **On-Screen Display (OSD)**:
   - ToolTip follows the cursor in real time while drawing gestures.
   - Formats symbols cleanly: `R(右鍵) ↑←`, `R(右鍵) → » 動作名稱`.
4. **Target Evaluation Hierarchy**:
   - Rule evaluation strictly follows:
     ```text
     規則邏輯：放行名單 > 特定程式 > 預設
     ```
   - **放行名單 (Disabled/Allowlist)**: Unintercepted pass-through for games or drawing apps.
   - **特定程式 (Specific App Groups)**: Matches active executable name (e.g. `chrome.exe`, `msedge.exe`).
   - **預設 (Global Default)**: Fallback rules applied when no specific group matches.

---

## 3. Directory Structure

```text
Mouse-gesture-5btn/
├── AGENTS.md                  # AI agent engineering rules and workflow guidelines
├── DEVELOPMENT.md             # Architecture, features, and developer commands
├── README.md                  # User-facing manual and quickstart
├── package.json               # Node dependencies and npm scripts
├── engine/
│   └── GestureEngine.ahk      # Core AutoHotkey v2 gesture state machine & recognizer
├── vendor/
│   └── autohotkey/
│       └── AutoHotkey64.exe   # Bundled portable AutoHotkey v2 executable
├── src-tauri/
│   ├── Cargo.toml             # Rust package definition
│   ├── tauri.conf.json        # Tauri 2 configuration
│   └── src/
│       ├── config.rs          # Data models and default configurations
│       ├── generator.rs       # AHK v2 script code generator
│       ├── tray.rs            # Windows System Tray and menu management
│       ├── commands.rs        # Tauri IPC invoke handlers
│       ├── lib.rs             # Application bootstrap entry point
│       └── main.rs            # Binary entry point
├── src/
│   ├── types.ts               # TypeScript data definitions matching Rust backend
│   ├── defaults.ts            # Default presets and targets
│   ├── styles.css             # Windows 11 Fluent animations & global styling
│   ├── components/            # Reusable UI widgets and dialogs
│   │   ├── AddProcessDialog.tsx
│   │   ├── EditActionDialog.tsx
│   │   ├── EditGestureDialog.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   └── views/                 # Tab views
│       ├── TargetsView.tsx    # Target hierarchy table: [ ] | Gesture | Action
│       ├── GesturesView.tsx   # Gesture template cards & creator
│       ├── ActionsView.tsx    # Action presets view
│       └── SettingsView.tsx   # Distance threshold, edge scroll & debug log switches
└── runtime/                   # Local test & execution sandbox
    └── RunTest.ahk            # Headless automated gesture simulation test runner
```

---

## 4. Developer CLI Commands

### Testing & Verification
```bash
# Run headless automated gesture acceptance suite (< 1 second)
npm run test:engine

# Verify frontend TypeScript types and production build
npm run build

# Verify Rust backend compilation
cargo check --manifest-path src-tauri/Cargo.toml
```

### Development Modes
```bash
# 1. UI-Only Fast Dev (No Rust build, Vite HMR at http://localhost:1420)
npm run dev

# 2. Full Desktop App Dev (Hot-reloading frontend + Tauri host)
npm run tauri:dev

# 3. Production Desktop Package Build
npm run tauri:build
```

### Git Feature Branch Protocol
```bash
# Start a new feature
git checkout -b feat/<feature-name>

# Verify before commit
npm run test:engine
npm run build

# Commit changes
git add <files>
git commit -m "feat(<scope>): <short description>"

# Merge back into main
git checkout main
git merge feat/<feature-name>
```
