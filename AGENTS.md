# AGENTS.md - AI Agent Collaboration & Engineering Guidelines

This document specifies the workflow, engineering standards, and communication protocols for AI agents working on the `Mouse-gesture-5btn` project.

- For **System Architecture & Domain Models**, see [ARCHITECTURE.md](file:///d:/My%20Data/真的文件/我的git/Other/Mouse-gesture-5btn/ARCHITECTURE.md).
- For **RD Workflow & Developer Toolchain**, see [DEVELOPMENT.md](file:///d:/My%20Data/真的文件/我的git/Other/Mouse-gesture-5btn/DEVELOPMENT.md).

---

## 1. Core Principles

1. **Agile & Incremental Development**:
   - Focus on one atomic feature or bug fix at a time.
   - Clarify advantages, scope of impact, and potential side effects before implementation.
2. **Feature Branch Workflow (Mandatory)**:
   - NEVER commit directly to `main`.
   - Always create a dedicated branch: `git checkout -b <type>/<short-name>`.
   - Run the complete quality gate (`npm run verify`) before merging into `main`.
3. **Clean Code & Professional Style**:
   - Follow standard conventions (Google/Java style guide, CamelCase for JS/TS, snake_case for Rust/AHK globals with `g` prefix).
   - Concise and self-explanatory naming (e.g. `cnt`, `msg`, `del`, `getState()`).
   - English-only code comments, reserved only for non-trivial logic.
4. **Communication Tone**:
   - Traditional Chinese (繁體中文) for all explanations and reports.
   - Strictly NO EMOJIS anywhere.
   - Enthusiastic, optimistic, and technically rigorous tone.

---

## 2. Git Workflow & Commit Rules

### Branch Naming Conventions
- `feat/<feature-name>`: New feature (e.g., `feat/mgl-presets`, `feat/osd-trail`)
- `fix/<bug-name>`: Bug fixes (e.g., `fix/ahk-working-dir`)
- `refactor/<module>`: Structural refactoring without behavior change (e.g., `refactor/backend-modules`)
- `docs/<subject>`: Documentation updates (e.g., `docs/agents-and-development-guide`)
- `test/<test-name>`: Adding or modifying test suites

### Commit Message Standards
- Language: English only.
- Format: Conventional Commits, 1 to 3 lines maximum.
  ```text
  <type>(<scope>): <concise subject>

  [optional body explaining why]
  ```
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`.

### Verification Before Merge
Every pull request or merge back to `main` must pass:
1. `npm run test:engine`: Headless AHK gesture recognition suite (100% pass).
2. `npm run test:i18n`: Translation key parity and static key validation.
3. `npm run build`: Frontend TypeScript and Vite bundle verification.
4. `npm run test:rust`: Rust unit and documentation tests.
5. `npm run check:rust`: Rust compilation check.

Run all five gates with `npm run verify`.

---

## 3. Architecture & Separation of Concerns

The project is split into three decoupled tiers to avoid unnecessary full rebuilds:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend UI Tier (React 19 + Fluent UI)                  │
│    - Dev Command: npm run dev                               │
│    - Fast HMR (~50ms) in standard browser without Cargo     │
└───────────────────────────────┬─────────────────────────────┘
                                │ JSON IPC Commands
┌───────────────────────────────▼─────────────────────────────┐
│ 2. Backend Host Tier (Tauri 2 Rust Host)                    │
│    - Modular files in src-tauri/src/ (config, generator, etc)│
│    - Only bridges OS events, system tray, and config files   │
└───────────────────────────────┬─────────────────────────────┘
                                │ #Include
┌───────────────────────────────▼─────────────────────────────┐
│ 3. Core Engine Tier (GestureEngine.ahk - AutoHotkey v2)     │
│    - Pure dynamic script: Zero compilation required         │
│    - Test Command: npm run test:engine (1-second headless)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Domain Terminology & Ubiquitous Language

All modules, APIs, and UI labels must align with the standardized domain model:
- **Rule (`Rule`)**: `Rule { scope, trigger, commands }`. The core entity connecting where, what, and how.
- **Scope (`Scope`)**: Replaces ambiguous "Target". Indicates execution boundary (`global` | `app` | `group` | `allowlist`).
- **Trigger (`Trigger`)**: Replaces gesture-only terminology. Unifies mouse gestures and keyboard hotkeys.
- **Command (`Command[]`)**: Replaces "Action/Behavior". An array of commands natively supporting macro sequences.

---

## 5. Requirement Ambiguity Protocol
When a requirement is ambiguous or has multiple viable architectural paths:
1. Do NOT guess or silently make decisions.
2. Formulate 2 to 3 distinct options with pros and cons.
3. Present them clearly to the user in Traditional Chinese:
   - "你的意思是這樣...嗎？"
   - "請告訴我您的決定 1 / 2 / 3"
