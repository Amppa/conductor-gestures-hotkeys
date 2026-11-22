# Keyboard Trigger Rule Implementation Plan

## Goal

Compile enabled keyboard rules into context-sensitive AutoHotkey v2 hotkeys while preserving native input whenever no rule matches.

The runtime must satisfy these invariants:

1. A keyboard trigger with no enabled rule emits no AHK hotkey.
2. A trigger with rules only in other scopes passes through natively.
3. Disabled applications always receive the original key.
4. Rule-generated synthetic input never triggers another generated rule.
5. Remaps preserve key-down, key-up, auto-repeat, and extra held modifiers.

## Template Semantics

- Trigger Gestures and Trigger Hotkeys are template catalogs.
- Assigning either template type to a Rule performs a copy by value.
- The Rule owns its copied trigger data and stores no template reference.
- Later template edits or deletion never propagate to existing Rules.
- The Trigger Hotkeys catalog therefore has no enabled switch and no usage-count column.
- Runtime registration is determined only by enabled Rules, never by catalog membership.
- Keyboard trigger matching always allows additional held modifiers and exposes no matching-mode option.

## Current State

- Keyboard bindings already use the same `Target -> Binding -> Gesture + Action` structure as mouse gestures.
- The generator currently emits keyboard bindings only from the global target.
- Generated keyboard hotkeys currently use wildcard prefixes and are not scope-aware.
- Legacy `keyRemaps` remain in the config for backward compatibility.
- The Trigger Hotkeys page is still a placeholder; existing keyboard templates and target bindings provide the current manual-test path.

## Scope

### Included

- Generate keyboard hotkey variants for enabled group and global bindings.
- Preserve target priority: disabled applications, groups in config order, then global.
- Use native pass-through instead of intercept-and-replay when no variant matches.
- Preserve wildcard matching for remap and suppression rules so extra modifiers continue to work.
- Isolate generated keyboard rules from synthetic input using AHK input levels.
- Keep legacy `keyRemaps` working without duplicating bindings already represented by rules.
- Add Rust generator tests and AHK syntax/runtime coverage where practical.

### Deferred

- Migration from the current `Binding` model to `Rule { scope, trigger, commands[] }`.
- Multiple commands per rule.
- Tap-versus-hold behavior for standalone modifier keys.
- Exact modifier matching.
- Rule chaining through synthetic keyboard events.

## Generated AHK Design

### Window groups

Generate stable AHK window groups for disabled applications and each enabled target group. Conditions use simple `WinActive("ahk_group ...")` expressions so AHK can evaluate them efficiently.

### Variant order

For each used trigger, emit variants in this order:

1. Disabled-app pass-through variant.
2. Enabled group variants in config order.
3. Global fallback variant.

AHK chooses the first eligible contextual variant and gives the unconditional global variant the lowest priority.

### Native pass-through

Disabled variants use the tilde prefix. If no contextual or global variant exists for the active window, AHK treats the hotkey as inactive and Windows receives the original key without a compensating `Send`.

### Synthetic input isolation

Generated keyboard hotkeys use `#InputLevel 1`. Generated key commands execute with `SendLevel 0`. Events produced by commands therefore cannot activate generated keyboard rules.

The existing AHK hotkey-rate safety limit remains enabled as a final circuit breaker.

### Action behavior

- `noop`: suppress the matching physical key.
- `remap`: use AHK remap semantics and allow extra held modifiers.
- `keys`: send at level 0 through a generated helper.
- `run`: invoke `Run` without synthesizing input.
- `ahk`: execute trusted custom AHK code inside the selected variant.

Custom AHK which explicitly changes `SendLevel` is outside the recursion guarantee and remains an advanced trusted-code escape hatch.

## Compatibility

- Existing global `LAlt -> LWin`, `LWin -> LAlt`, and `Insert -> noop` bindings keep their behavior.
- Existing disabled configurations emit no keyboard hotkeys.
- Existing `keyRemaps` continue to generate global remaps after rule-based bindings.
- Config schema remains backward compatible in this iteration.

## Commit Plan

1. `docs(hotkeys): document keyboard trigger rule design`
2. `refactor(generator): compile scoped keyboard rule variants`
3. `test(generator): cover keyboard scope and recursion safeguards`
4. `docs(architecture): define trigger template value semantics`
5. `feat(hotkeys): add keyboard trigger template catalog`
6. `refactor(ui): separate gesture and hotkey templates`

## Automated Verification

- `npm run test:rust`
- `npm run test:engine`
- `npm run verify`

## Manual Acceptance

1. Enable both global remaps: `LAlt -> LWin` and `LWin -> LAlt`.
2. Confirm modifier combinations still work, including the intended physical-key position for `Alt+Tab`.
3. Enable `Insert -> noop` globally and confirm Insert is suppressed.
4. Move the Insert rule to an application group and confirm:
   - Insert is suppressed inside a matching application.
   - Insert behaves normally in an unmatched application.
   - Insert behaves normally in an excluded application.
5. Create a keyboard rule whose command sends the same key or includes Alt, then confirm it runs once without recursion.
6. Pause and resume the engine and confirm native keyboard behavior returns while paused.

## Known Manual-Test Risks

- Context-sensitive modifier remaps must be tested while changing foreground windows with the source key held.
- Elevated applications may reject synthetic input from a non-elevated engine.
- Custom AHK can bypass the generated input-level isolation deliberately.
