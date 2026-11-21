# ARCHITECTURE.md - System & Domain Specs

## 1. 3-Tier Architecture
`Frontend (React 19 + Fluent)` --(JSON IPC)--> `Host (Tauri 2 Rust)` --(#Include)--> `Engine (AHK v2)`
- Frontend: Isolated UI, no direct OS calls.
- Engine: Pure dynamic AHK v2 script (headless testable).

## 2. Core Domain Model
```typescript
interface Rule { scope: Scope; trigger: Trigger; commands: Command[]; }
interface Scope { type: 'global' | 'app' | 'group' | 'allowlist'; targetList?: string[]; }
interface Trigger { type: 'gesture' | 'hotkey'; pattern: string; }
interface Command { type: 'hotkey' | 'text' | 'script' | 'window'; value: string; delayMs?: number; }
```

## 3. Evaluation Hierarchy
`Allowlist (放行名單)` > `App/Group (特定程式/群組)` > `Global (全域預設)`

## 4. Trigger & Spatial Notation
- Mouse Triggers: `R, M, L, X1, X2` | Chord Wheel: `R + W↑`, `R + W↓`, `X1 + W↑`
- Hot Corners: `CornerTL`, `CornerTR`, `CornerBL`, `CornerBR`
- Screen Edges: `EdgeTopL`, `EdgeTopR`, `EdgeLeft`, `EdgeRight`, `EdgeBottomL`, `EdgeBottomR`
