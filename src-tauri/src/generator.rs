use std::collections::HashSet;

use crate::config::{AppConfig, Binding, Target};

const KEYBOARD_RUNTIME_HELPERS: &str = r#"global gGeneratedRemapState := Map()
global gGeneratedRemapDestinationCounts := Map()

GeneratedSendKeys(keys) {
    previousLevel := SendLevel(0)
    try Send(keys)
    finally SendLevel(previousLevel)
}

GeneratedRemapKeyDown(source, destination) {
    global gGeneratedRemapState, gGeneratedRemapDestinationCounts
    if (destination = "")
        return
    if !gGeneratedRemapState.Has(source) {
        gGeneratedRemapState[source] := destination
        count := gGeneratedRemapDestinationCounts.Get(destination, 0) + 1
        gGeneratedRemapDestinationCounts[destination] := count
    }
    activeDestination := gGeneratedRemapState[source]
    previousLevel := SendLevel(0)
    try {
        SetKeyDelay(-1)
        Send("{Blind}{" activeDestination " DownR}")
    } finally {
        SendLevel(previousLevel)
    }
}

GeneratedRemapKeyUp(source) {
    global gGeneratedRemapState, gGeneratedRemapDestinationCounts
    if !gGeneratedRemapState.Has(source)
        return
    destination := gGeneratedRemapState.Delete(source)
    count := gGeneratedRemapDestinationCounts.Get(destination, 1) - 1
    if (count > 0) {
        gGeneratedRemapDestinationCounts[destination] := count
        return
    }
    gGeneratedRemapDestinationCounts.Delete(destination)
    previousLevel := SendLevel(0)
    try {
        SetKeyDelay(-1)
        Send("{Blind}{" destination " Up}")
    } finally {
        SendLevel(previousLevel)
    }
}

"#;

pub fn trigger_to_ahk_name(t: &str) -> &str {
    match t {
        "RB" | "R" => "RButton",
        "MB" | "M" => "MButton",
        "LB" | "L" => "LButton",
        "X1" | "X1B" => "XButton1",
        "X2" | "X2B" => "XButton2",
        other => other,
    }
}

pub fn is_mouse_or_spatial_trigger(trig: &str) -> bool {
    matches!(
        trig,
        "R" | "RB"
            | "RButton"
            | "M"
            | "MB"
            | "MButton"
            | "L"
            | "LB"
            | "LButton"
            | "X1"
            | "X1B"
            | "XButton1"
            | "X2"
            | "X2B"
            | "XButton2"
            | "CornerTL"
            | "CornerTR"
            | "CornerBL"
            | "CornerBR"
            | "EdgeTop"
            | "EdgeBottom"
            | "EdgeLeft"
            | "EdgeRight"
    )
}

pub fn ahk_quote(s: &str) -> String {
    s.replace('"', "\"\"")
}

fn is_keyboard_binding(binding: &Binding) -> bool {
    let trigger = binding.gesture.trigger.trim();
    binding.enabled && !trigger.is_empty() && !is_mouse_or_spatial_trigger(trigger)
}

fn is_gesture_binding(binding: &Binding) -> bool {
    binding.enabled && is_mouse_or_spatial_trigger(&binding.gesture.trigger)
}

fn write_hotkey_action(script: &mut String, binding: &Binding) {
    let trigger = binding.gesture.trigger.trim();
    let action = &binding.action;

    if action.action_type == "noop"
        || action.id == "act-noop"
        || action.value.eq_ignore_ascii_case("none")
    {
        script.push_str(&format!("*{}::return\n", trigger));
        return;
    }

    match action.action_type.as_str() {
        "remap" => script.push_str(&format!(
            "*{}::GeneratedRemapKeyDown(\"{}\", \"{}\")\n",
            trigger,
            ahk_quote(trigger),
            ahk_quote(action.value.trim())
        )),
        "keys" => script.push_str(&format!(
            "*{}::GeneratedSendKeys(\"{}\")\n",
            trigger,
            ahk_quote(&action.value)
        )),
        "run" => script.push_str(&format!(
            "*{}::Run(\"{}\")\n",
            trigger,
            ahk_quote(&action.value)
        )),
        "ahk" => {
            script.push_str(&format!("*{}::\n{{\n", trigger));
            script.push_str("    previousLevel := SendLevel(0)\n");
            script.push_str("    try {\n");
            for line in action.value.lines() {
                script.push_str(&format!("        {}\n", line));
            }
            script.push_str("    } finally {\n");
            script.push_str("        SendLevel(previousLevel)\n");
            script.push_str("    }\n");
            script.push_str("}\n");
        }
        _ => {}
    }
}

fn write_target_hotkeys(
    script: &mut String,
    target: &Target,
    emitted_triggers: &mut HashSet<String>,
) {
    for binding in target
        .bindings
        .iter()
        .filter(|binding| is_keyboard_binding(binding))
    {
        let trigger = binding.gesture.trigger.trim().to_ascii_lowercase();
        if emitted_triggers.insert(trigger) {
            write_hotkey_action(script, binding);
        }
    }
}

fn write_keyboard_helpers(script: &mut String) {
    script.push_str(KEYBOARD_RUNTIME_HELPERS);
}

pub fn resolve_action_display_name(action_id: &str, fallback_name: &str, lang: &str) -> String {
    if lang == "zh-TW" {
        match action_id {
            "act-back" => "上一頁".to_string(),
            "act-forward" => "下一頁".to_string(),
            "act-close-tab" => "關閉分頁".to_string(),
            "act-reopen-tab" => "回復關閉分頁".to_string(),
            "act-prev-tab" => "切換上一分頁".to_string(),
            "act-next-tab" => "切換下一分頁".to_string(),
            "act-minimize" => "最小化視窗".to_string(),
            "act-show-desktop" => "顯示桌面".to_string(),
            "act-vol-up" => "提高音量".to_string(),
            "act-vol-down" => "降低音量".to_string(),
            "act-noop" => "停用按鍵 (無動作)".to_string(),
            "act-lwin" => "觸發 Win 鍵".to_string(),
            "act-lalt" => "觸發 Alt 鍵".to_string(),
            _ => fallback_name.to_string(),
        }
    } else {
        match action_id {
            "act-back" => "Back".to_string(),
            "act-forward" => "Forward".to_string(),
            "act-close-tab" => "Close Tab".to_string(),
            "act-reopen-tab" => "Reopen Closed Tab".to_string(),
            "act-prev-tab" => "Previous Tab".to_string(),
            "act-next-tab" => "Next Tab".to_string(),
            "act-minimize" => "Minimize Window".to_string(),
            "act-show-desktop" => "Show Desktop".to_string(),
            "act-vol-up" => "Volume Up".to_string(),
            "act-vol-down" => "Volume Down".to_string(),
            "act-noop" => "No-op (Mute)".to_string(),
            "act-lwin" => "Trigger Win".to_string(),
            "act-lalt" => "Trigger Alt".to_string(),
            _ => fallback_name.to_string(),
        }
    }
}

pub fn generate_ahk_script(config: &AppConfig, revision: u64) -> String {
    let mut s = String::new();
    s.push_str("#Requires AutoHotkey v2.0\n");
    s.push_str("#SingleInstance Force\n\n");
    s.push_str(&format!("; Revision: {}\n", revision));

    // Include the core gesture engine located in the same runtime directory
    s.push_str("#Include \"GestureEngine.ahk\"\n\n");

    s.push_str(&format!(
        "global gThreshold := {}\n",
        config.engine.threshold_px
    ));
    s.push_str(&format!(
        "global gEdgeScrollEnabled := {}\n",
        if config.edge_scroll.enabled {
            "true"
        } else {
            "false"
        }
    ));
    s.push_str(&format!(
        "global gDebugLogEnabled := {}\n\n",
        if config.engine.debug { "true" } else { "false" }
    ));

    // Connect function hooks
    s.push_str("global gFnIsProcessDisabled := GeneratedIsProcessDisabled\n");
    s.push_str("global gFnDispatchGestureAction := GeneratedDispatchGestureAction\n");
    s.push_str("global gFnGetGestureActionName := GeneratedGetGestureActionName\n\n");

    // Priority 3: Disabled processes function
    s.push_str("; Priority 3: Blacklist (Disabled apps)\n");
    s.push_str("GeneratedIsProcessDisabled(procName) {\n");
    let disabled_targets: Vec<&Target> = config
        .targets
        .iter()
        .filter(|t| t.kind == "disabled" && t.enabled)
        .collect();
    let mut exes = Vec::new();
    for dt in disabled_targets {
        for exe in &dt.executables {
            let trimmed = exe.trim().to_ascii_lowercase();
            if !trimmed.is_empty() {
                exes.push(trimmed);
            }
        }
    }
    // Always include app itself in blacklist so it never intercepts gestures during config/recording
    if !exes.contains(&"mouse-gesture-5btn.exe".to_string()) {
        exes.push("mouse-gesture-5btn.exe".to_string());
    }
    if !exes.is_empty() {
        s.push_str("    switch StrLower(procName) {\n");
        let case_items = exes
            .iter()
            .map(|e| format!("\"{}\"", ahk_quote(e)))
            .collect::<Vec<_>>()
            .join(", ");
        s.push_str(&format!(
            "        case {}:\n            return true\n",
            case_items
        ));
        s.push_str("        default:\n            return false\n");
        s.push_str("    }\n");
    } else {
        s.push_str("    return false\n");
    }
    s.push_str("}\n\n");

    // Action dispatch function (Priority 2: Group > Priority 1: Global)
    s.push_str("; Action Dispatcher (3. Disabled > 2. Groups > 1. Global)\n");
    s.push_str("GeneratedDispatchGestureAction(trigger, stepStr, procName) {\n");
    s.push_str("    pLower := StrLower(procName)\n\n");

    // Priority 2: Groups
    let group_targets: Vec<&Target> = config
        .targets
        .iter()
        .filter(|t| t.kind == "group" && t.enabled)
        .collect();
    for gt in &group_targets {
        let group_exes: Vec<String> = gt
            .executables
            .iter()
            .map(|e| e.trim().to_ascii_lowercase())
            .filter(|e| !e.is_empty())
            .collect();

        if !group_exes.is_empty() && !gt.bindings.is_empty() {
            let cond = group_exes
                .iter()
                .map(|e| format!("pLower = \"{}\"", ahk_quote(e)))
                .collect::<Vec<_>>()
                .join(" || ");
            s.push_str(&format!("    ; Group: {}\n", gt.name));
            s.push_str(&format!("    if ({}) {{\n", cond));
            for b in &gt.bindings {
                if !is_gesture_binding(b) {
                    continue;
                }
                let trig = trigger_to_ahk_name(&b.gesture.trigger);
                let steps = b.gesture.steps.join(",");
                s.push_str(&format!(
                    "        if (trigger = \"{}\" && stepStr = \"{}\") {{\n",
                    trig, steps
                ));
                match b.action.action_type.as_str() {
                    "keys" => s.push_str(&format!(
                        "            Send(\"{}\")\n",
                        ahk_quote(&b.action.value)
                    )),
                    "run" => s.push_str(&format!(
                        "            Run(\"{}\")\n",
                        ahk_quote(&b.action.value)
                    )),
                    "mouse" => s.push_str(&format!(
                        "            Click(\"{}\")\n",
                        ahk_quote(&b.action.value)
                    )),
                    "wheel" => s.push_str(&format!(
                        "            Send(\"{}\")\n",
                        ahk_quote(&b.action.value)
                    )),
                    "ahk" => {
                        for line in b.action.value.lines() {
                            s.push_str(&format!("            {}\n", line));
                        }
                    }
                    _ => {}
                }
                s.push_str("            return true\n");
                s.push_str("        }\n");
            }
            s.push_str("    }\n\n");
        }
    }

    // Priority 1: Global
    let global_targets: Vec<&Target> = config
        .targets
        .iter()
        .filter(|t| t.kind == "global" && t.enabled)
        .collect();
    for gt in &global_targets {
        s.push_str("    ; Priority 1: Global Fallback\n");
        for b in &gt.bindings {
            if !is_gesture_binding(b) {
                continue;
            }
            let trig = trigger_to_ahk_name(&b.gesture.trigger);
            let steps = b.gesture.steps.join(",");
            s.push_str(&format!(
                "    if (trigger = \"{}\" && stepStr = \"{}\") {{\n",
                trig, steps
            ));
            match b.action.action_type.as_str() {
                "keys" => s.push_str(&format!(
                    "        Send(\"{}\")\n",
                    ahk_quote(&b.action.value)
                )),
                "run" => s.push_str(&format!(
                    "        Run(\"{}\")\n",
                    ahk_quote(&b.action.value)
                )),
                "mouse" => s.push_str(&format!(
                    "        Click(\"{}\")\n",
                    ahk_quote(&b.action.value)
                )),
                "wheel" => s.push_str(&format!(
                    "        Send(\"{}\")\n",
                    ahk_quote(&b.action.value)
                )),
                "ahk" => {
                    for line in b.action.value.lines() {
                        s.push_str(&format!("        {}\n", line));
                    }
                }
                _ => {}
            }
            s.push_str("        return true\n");
            s.push_str("    }\n");
        }
    }

    s.push_str("    return false\n");
    s.push_str("}\n\n");

    // Action Name Getter for OSD hint (Priority 2: Groups > Priority 1: Global)
    s.push_str("; Action Name Query for OSD Tip\n");
    s.push_str("GeneratedGetGestureActionName(trigger, stepStr, procName) {\n");
    s.push_str("    pLower := StrLower(procName)\n\n");

    for gt in &group_targets {
        let group_exes: Vec<String> = gt
            .executables
            .iter()
            .map(|e| e.trim().to_ascii_lowercase())
            .filter(|e| !e.is_empty())
            .collect();

        if !group_exes.is_empty() && !gt.bindings.is_empty() {
            let cond = group_exes
                .iter()
                .map(|e| format!("pLower = \"{}\"", ahk_quote(e)))
                .collect::<Vec<_>>()
                .join(" || ");
            s.push_str(&format!("    if ({}) {{\n", cond));
            for b in &gt.bindings {
                if !is_gesture_binding(b) {
                    continue;
                }
                let trig = trigger_to_ahk_name(&b.gesture.trigger);
                let steps = b.gesture.steps.join(",");
                let act_name =
                    resolve_action_display_name(&b.action.id, &b.action.name, &config.language);
                s.push_str(&format!(
                    "        if (trigger = \"{}\" && stepStr = \"{}\")\n",
                    trig, steps
                ));
                s.push_str(&format!(
                    "            return \"{}\"\n",
                    ahk_quote(&act_name)
                ));
            }
            s.push_str("    }\n\n");
        }
    }

    for gt in &global_targets {
        for b in &gt.bindings {
            if !is_gesture_binding(b) {
                continue;
            }
            let trig = trigger_to_ahk_name(&b.gesture.trigger);
            let steps = b.gesture.steps.join(",");
            let act_name =
                resolve_action_display_name(&b.action.id, &b.action.name, &config.language);
            s.push_str(&format!(
                "    if (trigger = \"{}\" && stepStr = \"{}\")\n",
                trig, steps
            ));
            s.push_str(&format!("        return \"{}\"\n", ahk_quote(&act_name)));
        }
    }

    s.push_str("    return \"\"\n");
    s.push_str("}\n");

    let mut keyboard_triggers = Vec::new();
    let mut keyboard_trigger_keys = HashSet::new();
    let mut remap_trigger_keys = HashSet::new();
    for target in group_targets.iter().chain(global_targets.iter()) {
        for binding in target
            .bindings
            .iter()
            .filter(|binding| is_keyboard_binding(binding))
        {
            let trigger = binding.gesture.trigger.trim();
            let trigger_key = trigger.to_ascii_lowercase();
            if binding.action.action_type == "remap" {
                remap_trigger_keys.insert(trigger_key.clone());
            }
            if keyboard_trigger_keys.insert(trigger_key) {
                keyboard_triggers.push(trigger.to_string());
            }
        }
    }
    for remap in config.key_remaps.iter().filter(|remap| remap.enabled) {
        let trigger = remap.src_key.trim();
        let destination = remap.dst_key.trim();
        let trigger_key = trigger.to_ascii_lowercase();
        if !destination.is_empty()
            && !destination.eq_ignore_ascii_case("none")
            && !destination.eq_ignore_ascii_case("disabled")
        {
            remap_trigger_keys.insert(trigger_key.clone());
        }
        if !trigger.is_empty() && keyboard_trigger_keys.insert(trigger_key) {
            keyboard_triggers.push(trigger.to_string());
        }
    }

    if !keyboard_triggers.is_empty() {
        s.push_str(
            "\n; ------------------------------------------------------------------------------\n",
        );
        s.push_str("; Context-sensitive keyboard rules\n");
        s.push_str(
            "; ------------------------------------------------------------------------------\n",
        );
        write_keyboard_helpers(&mut s);

        if !exes.is_empty() {
            for exe in &exes {
                s.push_str(&format!(
                    "GroupAdd(\"GeneratedDisabledApps\", \"ahk_exe {}\")\n",
                    ahk_quote(exe)
                ));
            }
            s.push('\n');
        }

        for (index, target) in group_targets.iter().enumerate() {
            if !target.bindings.iter().any(is_keyboard_binding) {
                continue;
            }
            for exe in target
                .executables
                .iter()
                .map(|exe| exe.trim())
                .filter(|exe| !exe.is_empty())
            {
                s.push_str(&format!(
                    "GroupAdd(\"GeneratedKeyboardGroup{}\", \"ahk_exe {}\")\n",
                    index,
                    ahk_quote(exe)
                ));
            }
        }
        s.push('\n');
        s.push_str("#InputLevel 1\n");

        if !exes.is_empty() {
            s.push_str("#HotIf WinActive(\"ahk_group GeneratedDisabledApps\")\n");
            for trigger in &keyboard_triggers {
                s.push_str(&format!("~*{}::return\n", trigger));
            }
        }

        for (index, target) in group_targets.iter().enumerate() {
            if !target.bindings.iter().any(is_keyboard_binding) {
                continue;
            }
            s.push_str(&format!(
                "#HotIf WinActive(\"ahk_group GeneratedKeyboardGroup{}\")\n",
                index
            ));
            let mut emitted_triggers = HashSet::new();
            write_target_hotkeys(&mut s, target, &mut emitted_triggers);
        }

        s.push_str("#HotIf\n");
        let mut global_triggers = HashSet::new();
        for target in &global_targets {
            write_target_hotkeys(&mut s, target, &mut global_triggers);
        }

        for remap in config.key_remaps.iter().filter(|remap| remap.enabled) {
            let source = remap.src_key.trim();
            let destination = remap.dst_key.trim();
            if source.is_empty() || !global_triggers.insert(source.to_ascii_lowercase()) {
                continue;
            }
            if destination.eq_ignore_ascii_case("none")
                || destination.eq_ignore_ascii_case("disabled")
            {
                s.push_str(&format!("*{}::return\n", source));
            } else if !destination.is_empty() {
                s.push_str(&format!(
                    "*{}::GeneratedRemapKeyDown(\"{}\", \"{}\")\n",
                    source,
                    ahk_quote(source),
                    ahk_quote(destination)
                ));
            }
        }

        for trigger in keyboard_triggers
            .iter()
            .filter(|trigger| remap_trigger_keys.contains(&trigger.to_ascii_lowercase()))
        {
            s.push_str(&format!(
                "~*{} up::GeneratedRemapKeyUp(\"{}\")\n",
                trigger,
                ahk_quote(trigger)
            ));
        }
        s.push_str("#InputLevel 0\n");
    }

    s
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{default_app_config, Action, Binding, Gesture};

    fn keyboard_binding(id: &str, trigger: &str, action_type: &str, value: &str) -> Binding {
        Binding {
            id: id.into(),
            enabled: true,
            gesture: Gesture {
                id: format!("key-{id}"),
                name: trigger.into(),
                trigger: trigger.into(),
                steps: vec![],
            },
            action: Action {
                id: format!("action-{id}"),
                name: action_type.into(),
                action_type: action_type.into(),
                value: value.into(),
            },
        }
    }

    #[test]
    fn test_default_key_remaps_not_emitted_when_disabled() {
        let cfg = default_app_config();
        let script = generate_ahk_script(&cfg, 1);
        assert!(!script.contains("Context-sensitive keyboard rules"));
        assert!(!script.contains("#InputLevel 1"));
    }

    #[test]
    fn test_target_bindings_with_keyboard_triggers_emitted_when_enabled() {
        let mut cfg = default_app_config();
        if let Some(gt) = cfg.targets.iter_mut().find(|t| t.kind == "global") {
            gt.bindings
                .push(keyboard_binding("insert", "Insert", "noop", ""));
            gt.bindings
                .push(keyboard_binding("lalt", "LAlt", "remap", "LWin"));
        }
        let script = generate_ahk_script(&cfg, 2);
        assert!(script.contains("#InputLevel 1"));
        assert!(script.contains("*Insert::return"));
        assert!(script.contains("*LAlt::GeneratedRemapKeyDown(\"LAlt\", \"LWin\")"));
        assert!(script.contains("~*LAlt up::GeneratedRemapKeyUp(\"LAlt\")"));
        assert!(!script.contains("~*Insert up::"));

        let dispatcher_start = script
            .find("GeneratedDispatchGestureAction(trigger")
            .expect("gesture dispatcher should be generated");
        let dispatcher_end = script[dispatcher_start..]
            .find("; Action Name Query")
            .map(|position| position + dispatcher_start)
            .expect("gesture dispatcher should have an end marker");
        assert!(!script[dispatcher_start..dispatcher_end].contains("trigger = \"Insert\""));
    }

    #[test]
    fn test_scoped_hotkeys_emit_disabled_group_then_group_then_global() {
        let mut cfg = default_app_config();
        if let Some(group) = cfg.targets.iter_mut().find(|t| t.kind == "group") {
            group.bindings.push(keyboard_binding(
                "group-insert",
                "Insert",
                "keys",
                "{Insert}",
            ));
        }
        if let Some(global) = cfg.targets.iter_mut().find(|t| t.kind == "global") {
            global
                .bindings
                .push(keyboard_binding("global-insert", "Insert", "noop", ""));
        }

        let script = generate_ahk_script(&cfg, 3);
        let disabled_pos = script
            .find("#HotIf WinActive(\"ahk_group GeneratedDisabledApps\")")
            .expect("disabled variant should be generated");
        let group_pos = script
            .find("#HotIf WinActive(\"ahk_group GeneratedKeyboardGroup0\")")
            .expect("group variant should be generated");
        let global_pos = script[group_pos..]
            .find("#HotIf\n*Insert::return")
            .map(|position| position + group_pos)
            .expect("global fallback should be generated");

        assert!(disabled_pos < group_pos);
        assert!(group_pos < global_pos);
        assert!(script.contains("~*Insert::return"));
        assert!(script.contains("*Insert::GeneratedSendKeys(\"{Insert}\")"));
    }

    #[test]
    fn test_generated_key_commands_use_synthetic_input_isolation() {
        let mut cfg = default_app_config();
        if let Some(global) = cfg.targets.iter_mut().find(|t| t.kind == "global") {
            global
                .bindings
                .push(keyboard_binding("alt-tab", "LAlt", "keys", "!{Tab}"));
        }

        let script = generate_ahk_script(&cfg, 4);
        assert!(script.contains("#InputLevel 1"));
        assert!(script.contains("previousLevel := SendLevel(0)"));
        assert!(script.contains("*LAlt::GeneratedSendKeys(\"!{Tab}\")"));
        assert!(!script.contains("*LAlt::Send("));
    }

    #[test]
    fn test_rule_binding_takes_precedence_over_legacy_remap() {
        let mut cfg = default_app_config();
        if let Some(global) = cfg.targets.iter_mut().find(|t| t.kind == "global") {
            global
                .bindings
                .push(keyboard_binding("lalt-rule", "LAlt", "remap", "LWin"));
        }
        if let Some(legacy) = cfg
            .key_remaps
            .iter_mut()
            .find(|remap| remap.src_key == "LAlt")
        {
            legacy.enabled = true;
            legacy.dst_key = "LCtrl".into();
        }

        let script = generate_ahk_script(&cfg, 5);
        assert_eq!(script.matches("*LAlt::GeneratedRemapKeyDown").count(), 1);
        assert!(script.contains("*LAlt::GeneratedRemapKeyDown(\"LAlt\", \"LWin\")"));
        assert!(!script.contains("\"LAlt\", \"LCtrl\""));
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_generated_keyboard_script_passes_ahk_validation() {
        use std::fs;
        use std::process::Command;
        use std::time::{SystemTime, UNIX_EPOCH};

        let mut cfg = default_app_config();
        if let Some(group) = cfg.targets.iter_mut().find(|t| t.kind == "group") {
            group.bindings.push(keyboard_binding(
                "group-insert",
                "Insert",
                "keys",
                "{Insert}",
            ));
        }
        if let Some(global) = cfg.targets.iter_mut().find(|t| t.kind == "global") {
            global
                .bindings
                .push(keyboard_binding("lalt", "LAlt", "remap", "LWin"));
            global
                .bindings
                .push(keyboard_binding("lwin", "LWin", "remap", "LAlt"));
        }

        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after Unix epoch")
            .as_nanos();
        let temp_dir = std::env::temp_dir().join(format!(
            "mouse-gesture-keyboard-test-{}-{timestamp}",
            std::process::id()
        ));
        fs::create_dir_all(&temp_dir).expect("temporary directory should be created");

        let manifest_dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
        let repo_dir = manifest_dir
            .parent()
            .expect("Tauri manifest should have a repository parent");
        fs::copy(
            repo_dir.join("engine/GestureEngine.ahk"),
            temp_dir.join("GestureEngine.ahk"),
        )
        .expect("gesture engine should be copied");
        let script_path = temp_dir.join("ActiveGestures.ahk");
        fs::write(&script_path, generate_ahk_script(&cfg, 6))
            .expect("generated script should be written");

        let output = Command::new(repo_dir.join("vendor/autohotkey/AutoHotkey64.exe"))
            .current_dir(&temp_dir)
            .arg("/ErrorStdOut")
            .arg("/validate")
            .arg(&script_path)
            .output()
            .expect("AutoHotkey validator should run");
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        let _ = fs::remove_dir_all(&temp_dir);

        assert!(
            output.status.success() && stdout.trim().is_empty() && stderr.trim().is_empty(),
            "generated AHK validation failed:\nstdout: {stdout}\nstderr: {stderr}"
        );
    }
}
