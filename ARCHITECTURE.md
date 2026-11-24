# ARCHITECTURE.md - System & Domain Specs

## 1. 3-Tier Architecture
`Frontend (React 19 + Fluent)` --(JSON IPC)--> `Host (Tauri 2 Rust)` --(#Include)--> `Engine (AHK v2)`
- Frontend: Isolated UI, no direct OS calls.
- Engine: Pure dynamic AHK v2 script (headless testable).

## 2. Core Domain Model

The Popup Menu navigation entry currently displays an in-development placeholder. Its planned behavior is to open a menu at the mouse cursor after a keyboard or mouse Trigger, allowing the user to click a Command. Runtime behavior and persistence for this feature are not implemented yet.

Trigger template navigation separates mouse gestures, Screen Edge & Corner Triggers, and keyboard hotkeys. Screen templates retain their existing `Edge*` / `Corner*` tokens in `gestureTemplates`; classification changes do not modify copied Rules. Editing one category preserves templates in the other categories.
```typescript
interface Rule { scope: Scope; trigger: Trigger; commands: Command[]; }
interface Scope { type: 'global' | 'app' | 'group' | 'allowlist'; targetList?: string[]; }
interface Trigger { type: 'gesture' | 'hotkey'; pattern: string; }
interface Command { type: 'hotkey' | 'text' | 'script' | 'window'; value: string; delayMs?: number; }
```

### 2.1 Trigger Template Value Semantics

- Trigger Gestures and Trigger Hotkeys are reusable templates, not live runtime rules.
- Selecting a template for a Rule copies its current fields into that Rule by value.
- Rules never retain a reference to the source template.
- Editing, renaming, or deleting a template does not modify Rules created from it earlier.
- A template with no Rule does not emit an AHK hotkey and does not intercept input.
- Keyboard triggers always allow additional held modifiers; this is fixed engine behavior, not a user-facing option.

## 3. Evaluation Hierarchy
`Allowlist (放行名單)` > `App/Group (特定程式/群組)` > `Global (全域預設)`

## 4. Trigger & Spatial Notation
- Mouse Triggers: `R, M, L, X1, X2` | Chord wheel labels use `滾輪↑` / `滾輪↓` in Traditional Chinese and `Wheel↑` / `Wheel↓` in English. Wheel directions retain standard arrows; stored tokens remain `WU` / `WD`.
- Gesture directions use U+1F860–U+1F867 consistently in names, stroke labels, standard-mode buttons, and OSD: `L 🡠`, `U 🡡`, `R 🡢`, `D 🡣`, `UL 🡤`, `UR 🡥`, `DR 🡦`, `DL 🡧`. Automatic names combine the localized trigger and directions (for example, `右鍵🡥`). Legacy arrow input remains supported; persisted direction tokens are unchanged.
- Hot Corners: `CornerTL`, `CornerTR`, `CornerBL`, `CornerBR`
- Screen Edges: `EdgeTopL`, `EdgeTopR`, `EdgeLeft`, `EdgeRight`, `EdgeBottomL`, `EdgeBottomR`
