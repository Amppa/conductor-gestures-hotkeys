use crate::config::{AppConfig, Target};

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
        "R" | "RB" | "RButton"
            | "M" | "MB" | "MButton"
            | "L" | "LB" | "LButton"
            | "X1" | "X1B" | "XButton1"
            | "X2" | "X2B" | "XButton2"
            | "CornerTL" | "CornerTR" | "CornerBL" | "CornerBR"
            | "EdgeTop" | "EdgeBottom" | "EdgeLeft" | "EdgeRight"
    )
}

pub fn ahk_quote(s: &str) -> String {
    s.replace('"', "\"\"")
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

    s.push_str(&format!("global gThreshold := {}\n", config.engine.threshold_px));
    s.push_str(&format!(
        "global gEdgeScrollEnabled := {}\n",
        if config.edge_scroll.enabled { "true" } else { "false" }
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
        s.push_str(&format!("        case {}:\n            return true\n", case_items));
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
                if !b.enabled || !is_mouse_or_spatial_trigger(&b.gesture.trigger) {
                    continue;
                }
                let trig = trigger_to_ahk_name(&b.gesture.trigger);
                let steps = b.gesture.steps.join(",");
                s.push_str(&format!(
                    "        if (trigger = \"{}\" && stepStr = \"{}\") {{\n",
                    trig, steps
                ));
                match b.action.action_type.as_str() {
                    "keys" => s.push_str(&format!("            Send(\"{}\")\n", ahk_quote(&b.action.value))),
                    "run" => s.push_str(&format!("            Run(\"{}\")\n", ahk_quote(&b.action.value))),
                    "mouse" => s.push_str(&format!("            Click(\"{}\")\n", ahk_quote(&b.action.value))),
                    "wheel" => s.push_str(&format!("            Send(\"{}\")\n", ahk_quote(&b.action.value))),
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
            if !b.enabled {
                continue;
            }
            let trig = trigger_to_ahk_name(&b.gesture.trigger);
            let steps = b.gesture.steps.join(",");
            s.push_str(&format!(
                "    if (trigger = \"{}\" && stepStr = \"{}\") {{\n",
                trig, steps
            ));
            match b.action.action_type.as_str() {
                "keys" => s.push_str(&format!("        Send(\"{}\")\n", ahk_quote(&b.action.value))),
                "run" => s.push_str(&format!("        Run(\"{}\")\n", ahk_quote(&b.action.value))),
                "mouse" => s.push_str(&format!("        Click(\"{}\")\n", ahk_quote(&b.action.value))),
                "wheel" => s.push_str(&format!("        Send(\"{}\")\n", ahk_quote(&b.action.value))),
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
                if !b.enabled || !is_mouse_or_spatial_trigger(&b.gesture.trigger) {
                    continue;
                }
                let trig = trigger_to_ahk_name(&b.gesture.trigger);
                let steps = b.gesture.steps.join(",");
                let act_name = resolve_action_display_name(&b.action.id, &b.action.name, &config.language);
                s.push_str(&format!(
                    "        if (trigger = \"{}\" && stepStr = \"{}\")\n",
                    trig, steps
                ));
                s.push_str(&format!("            return \"{}\"\n", ahk_quote(&act_name)));
            }
            s.push_str("    }\n\n");
        }
    }

    for gt in &global_targets {
        for b in &gt.bindings {
            if !b.enabled || !is_mouse_or_spatial_trigger(&b.gesture.trigger) {
                continue;
            }
            let trig = trigger_to_ahk_name(&b.gesture.trigger);
            let steps = b.gesture.steps.join(",");
            let act_name = resolve_action_display_name(&b.action.id, &b.action.name, &config.language);
            s.push_str(&format!(
                "    if (trigger = \"{}\" && stepStr = \"{}\")\n",
                trig, steps
            ));
            s.push_str(&format!("        return \"{}\"\n", ahk_quote(&act_name)));
        }
    }

    s.push_str("    return \"\"\n");
    s.push_str("}\n");

    // Key Remappings and Suppressions (Native AHK Remap & No-op)
    s.push_str("\n; ------------------------------------------------------------------------------\n");
    s.push_str("; Key Remappings and Suppressions (Native AHK Remap & No-op)\n");
    s.push_str("; ------------------------------------------------------------------------------\n");

    // 1. Unified Model: From Target Bindings
    for gt in &global_targets {
        for b in &gt.bindings {
            if !b.enabled {
                continue;
            }
            let trig = b.gesture.trigger.trim();
            if is_mouse_or_spatial_trigger(trig) || trig.is_empty() {
                continue;
            }
            if b.action.action_type == "noop"
                || b.action.id == "act-noop"
                || b.action.value.eq_ignore_ascii_case("none")
            {
                // Key suppression (no-op / mute)
                s.push_str(&format!("*{}::return\n", trig));
            } else if b.action.action_type == "remap" {
                // Transparent remap with native infinite loop protection
                s.push_str(&format!("*{}::{}\n", trig, b.action.value.trim()));
            } else if b.action.action_type == "keys" {
                s.push_str(&format!("*${}::Send(\"{}\")\n", trig, ahk_quote(&b.action.value)));
            } else if b.action.action_type == "ahk" {
                s.push_str(&format!("*${}::{}\n", trig, b.action.value.trim()));
            } else if b.action.action_type == "run" {
                s.push_str(&format!("*${}::Run(\"{}\")\n", trig, ahk_quote(&b.action.value)));
            }
        }
    }

    // 2. Backward compatibility: From key_remaps
    for kr in &config.key_remaps {
        if !kr.enabled {
            continue;
        }
        let src = kr.src_key.trim();
        let dst = kr.dst_key.trim();
        if src.is_empty() {
            continue;
        }
        if dst.eq_ignore_ascii_case("none") || dst.eq_ignore_ascii_case("disabled") {
            s.push_str(&format!("*{}::return\n", src));
        } else if !dst.is_empty() {
            s.push_str(&format!("*{}::{}\n", src, dst));
        }
    }

    s
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{default_app_config, Action, Binding, Gesture};

    #[test]
    fn test_default_key_remaps_not_emitted_when_disabled() {
        let cfg = default_app_config();
        let script = generate_ahk_script(&cfg, 1);
        assert!(!script.contains("*Insert::return"));
        assert!(!script.contains("*LAlt::LWin"));
        assert!(!script.contains("*LWin::LAlt"));
    }

    #[test]
    fn test_target_bindings_with_keyboard_triggers_emitted_when_enabled() {
        let mut cfg = default_app_config();
        if let Some(gt) = cfg.targets.iter_mut().find(|t| t.kind == "global") {
            gt.bindings.push(Binding {
                id: "test-insert".into(),
                enabled: true,
                gesture: Gesture {
                    id: "key-insert".into(),
                    name: "Insert".into(),
                    trigger: "Insert".into(),
                    steps: vec![],
                },
                action: Action {
                    id: "act-noop".into(),
                    name: "No-op".into(),
                    action_type: "noop".into(),
                    value: "".into(),
                },
            });
            gt.bindings.push(Binding {
                id: "test-lalt".into(),
                enabled: true,
                gesture: Gesture {
                    id: "key-lalt".into(),
                    name: "LAlt".into(),
                    trigger: "LAlt".into(),
                    steps: vec![],
                },
                action: Action {
                    id: "act-lwin".into(),
                    name: "Win".into(),
                    action_type: "remap".into(),
                    value: "LWin".into(),
                },
            });
        }
        let script = generate_ahk_script(&cfg, 2);
        assert!(script.contains("*Insert::return"));
        assert!(script.contains("*LAlt::LWin"));
    }
}
