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
npm run test:engine                                # Gate 1: AHK gesture engine suite
npm run test:i18n                                  # Gate 2: Translation key validation
npm run build                                      # Gate 3: Frontend TS build
npm run test:rust                                  # Gate 4: Rust unit and doc tests
npm run check:rust                                 # Gate 5: Rust compilation check

# Local Dev
npm run dev                                        # UI-only fast dev (Vite HMR)
npm run tauri:dev                                  # Full desktop dev
```
