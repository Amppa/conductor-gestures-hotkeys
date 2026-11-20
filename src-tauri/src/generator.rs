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
                if !b.enabled {
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
                if !b.enabled {
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
            if !b.enabled {
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

    s
}
