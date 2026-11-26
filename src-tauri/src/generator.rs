use std::collections::HashSet;

use crate::config::{
    normalize_osd_duration_ms, normalize_osd_font_size_px, normalize_osd_opacity_pct, Action,
    AppConfig, Binding, Target,
};

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

const MOUSE_OR_SPATIAL_TRIGGERS: &[&str] = &[
    "R",
    "RB",
    "RButton",
    "M",
    "MB",
    "MButton",
    "L",
    "LB",
    "LButton",
    "X1",
    "X1B",
    "XButton1",
    "X2",
    "X2B",
    "XButton2",
    "CornerTL",
    "CornerTR",
    "CornerBL",
    "CornerBR",
    "EdgeTop",
    "EdgeBottom",
    "EdgeLeft",
    "EdgeRight",
    "EdgeTopLeftHalf",
    "EdgeTopRightHalf",
    "EdgeBottomLeftHalf",
    "EdgeBottomRightHalf",
    "EdgeLeftTopHalf",
    "EdgeLeftBottomHalf",
    "EdgeRightTopHalf",
    "EdgeRightBottomHalf",
];

const ACTION_NAMES_ZH_TW: &[(&str, &str)] = &[
    ("act-back", "上一頁"),
    ("act-forward", "下一頁"),
    ("act-close-tab", "關閉分頁"),
    ("act-reopen-tab", "回復關閉分頁"),
    ("act-prev-tab", "切換上一分頁"),
    ("act-next-tab", "切換下一分頁"),
    ("act-minimize", "最小化視窗"),
    ("act-show-desktop", "顯示桌面"),
    ("act-vol-up", "提高音量"),
    ("act-vol-down", "降低音量"),
    ("act-noop", "停用按鍵 (無動作)"),
    ("act-lwin", "觸發 Win 鍵"),
    ("act-lalt", "觸發 Alt 鍵"),
];

const ACTION_NAMES_EN: &[(&str, &str)] = &[
    ("act-back", "Back"),
    ("act-forward", "Forward"),
    ("act-close-tab", "Close Tab"),
    ("act-reopen-tab", "Reopen Closed Tab"),
    ("act-prev-tab", "Previous Tab"),
    ("act-next-tab", "Next Tab"),
    ("act-minimize", "Minimize Window"),
    ("act-show-desktop", "Show Desktop"),
    ("act-vol-up", "Volume Up"),
    ("act-vol-down", "Volume Down"),
    ("act-noop", "No-op (Mute)"),
    ("act-lwin", "Trigger Win"),
    ("act-lalt", "Trigger Alt"),
];

pub fn trigger_to_ahk_name(t: &str) -> String {
    if is_mouse_combo(t) {
        return crate::config::normalize_trigger(t)
            .split('+')
            .map(trigger_to_ahk_name)
            .collect::<Vec<_>>()
            .join("+");
    }
    match t {
        "RB" | "R" => "RButton",
        "MB" | "M" => "MButton",
        "LB" | "L" => "LButton",
        "X1" | "X1B" => "XButton1",
        "X2" | "X2B" => "XButton2",
        other => other,
    }
    .to_string()
}

fn is_mouse_combo(trigger: &str) -> bool {
    trigger.contains('+')
        && trigger
            .split('+')
            .all(|key| ["L", "M", "R", "X1", "X2"].contains(&key))
}

pub fn is_mouse_or_spatial_trigger(trig: &str) -> bool {
    MOUSE_OR_SPATIAL_TRIGGERS.contains(&trig) || is_mouse_combo(trig)
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

fn localized<'a>(language: &str, zh_tw: &'a str, en: &'a str) -> &'a str {
    if language == "zh-TW" {
        zh_tw
    } else {
        en
    }
}

fn bool_literal(value: bool) -> &'static str {
    if value {
        "true"
    } else {
        "false"
    }
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
    let table = if lang == "zh-TW" {
        ACTION_NAMES_ZH_TW
    } else {
        ACTION_NAMES_EN
    };

    table
        .iter()
        .find(|(id, _)| *id == action_id)
        .map(|(_, name)| (*name).to_string())
        .unwrap_or_else(|| fallback_name.to_string())
}

fn enabled_targets<'a>(config: &'a AppConfig, kind: &str) -> Vec<&'a Target> {
    config
        .targets
        .iter()
        .filter(|target| target.kind == kind && target.enabled)
        .collect()
}

fn target_executables(target: &Target) -> Vec<String> {
    target
        .executables
        .iter()
        .map(|executable| executable.trim().to_ascii_lowercase())
        .filter(|executable| !executable.is_empty())
        .collect()
}

fn app_condition(executables: &[String]) -> String {
    executables
        .iter()
        .map(|executable| format!("pLower = \"{}\"", ahk_quote(executable)))
        .collect::<Vec<_>>()
        .join(" || ")
}

fn write_header(script: &mut String, config: &AppConfig, revision: u64) {
    script.push_str("#Requires AutoHotkey v2.0\n");
    script.push_str("#SingleInstance Force\n\n");
    script.push_str(&format!("; Revision: {}\n", revision));

    // Include the core gesture engine located in the same runtime directory
    script.push_str("#Include \"GestureEngine.ahk\"\n\n");

    script.push_str(&format!(
        "global gThreshold := {}\n",
        config.engine.threshold_px
    ));
    script.push_str(&format!(
        "global gOsdDurationMs := {}\n",
        normalize_osd_duration_ms(config.engine.osd_duration_ms)
    ));
    script.push_str(&format!(
        "global gOsdFontSizePx := {}\n",
        normalize_osd_font_size_px(config.engine.osd_font_size_px)
    ));
    script.push_str(&format!(
        "global gOsdOpacityPct := {}\n",
        normalize_osd_opacity_pct(config.engine.osd_opacity_pct)
    ));
    script.push_str(&format!(
        "global gOsdUnknownGestureLabel := \"{}\"\n",
        localized(&config.language, "未知手勢", "Unknown Gesture")
    ));
    script.push_str(&format!(
        "global gEdgeScrollEnabled := {}\n",
        bool_literal(config.edge_scroll.enabled)
    ));
    script.push_str(&format!(
        "global gDebugLogEnabled := {}\n\n",
        bool_literal(config.engine.debug)
    ));

    // Connect function hooks
    script.push_str(&format!(
        "global gWheelLabel := \"{}\"\n",
        localized(&config.language, "滾輪", "Wheel")
    ));
    script.push_str("global gFnIsProcessDisabled := GeneratedIsProcessDisabled\n");
    script.push_str("global gFnDispatchGestureAction := GeneratedDispatchGestureAction\n");
    script.push_str("global gFnGetGestureActionName := GeneratedGetGestureActionName\n\n");
    let mut triggers = Vec::new();
    for target in config
        .targets
        .iter()
        .filter(|target| target.enabled && target.kind != "disabled")
    {
        for binding in target.bindings.iter().filter(|binding| binding.enabled) {
            let trigger = crate::config::normalize_trigger(&binding.gesture.trigger);
            if ["M", "R", "X1", "X2"].contains(&trigger.as_str()) || is_mouse_combo(&trigger) {
                let name = trigger_to_ahk_name(&trigger);
                if !triggers.contains(&name) {
                    triggers.push(name);
                }
            }
        }
    }
    script.push_str(&format!(
        "SetMouseTriggers([{}])\n",
        triggers
            .iter()
            .map(|trigger| format!("\"{}\"", ahk_quote(trigger)))
            .collect::<Vec<_>>()
            .join(", ")
    ));
}

fn collect_disabled_executables(config: &AppConfig) -> Vec<String> {
    let mut executables = Vec::new();
    for target in config
        .targets
        .iter()
        .filter(|target| target.kind == "disabled" && target.enabled)
    {
        for executable in &target.executables {
            let trimmed = executable.trim().to_ascii_lowercase();
            if !trimmed.is_empty() {
                executables.push(trimmed);
            }
        }
    }

    // Always include the app itself so it never intercepts gestures while
    // the user is editing or recording.
    if !executables.iter().any(|exe| exe == "conductor.exe") {
        executables.push("conductor.exe".to_string());
    }
    executables
}

fn write_disabled_process_function(script: &mut String, executables: &[String]) {
    script.push_str("; Priority 3: Blacklist (Disabled apps)\n");
    script.push_str("GeneratedIsProcessDisabled(procName) {\n");

    if executables.is_empty() {
        script.push_str("    return false\n");
    } else {
        script.push_str("    switch StrLower(procName) {\n");
        let cases = executables
            .iter()
            .map(|executable| format!("\"{}\"", ahk_quote(executable)))
            .collect::<Vec<_>>()
            .join(", ");
        script.push_str(&format!(
            "        case {}:\n            return true\n",
            cases
        ));
        script.push_str("        default:\n            return false\n");
        script.push_str("    }\n");
    }

    script.push_str("}\n\n");
}

fn ordered_gesture_bindings(target: &Target) -> Vec<&Binding> {
    let mut bindings = target
        .bindings
        .iter()
        .filter(|binding| is_gesture_binding(binding))
        .collect::<Vec<_>>();
    bindings.sort_by_key(|binding| !binding.gesture.trigger.ends_with("Half"));
    bindings
}

fn write_dispatch_action(script: &mut String, action: &Action, indent: &str) {
    match action.action_type.as_str() {
        "keys" | "wheel" => {
            script.push_str(&format!("{indent}Send(\"{}\")\n", ahk_quote(&action.value)))
        }
        "run" => script.push_str(&format!("{indent}Run(\"{}\")\n", ahk_quote(&action.value))),
        "mouse" => script.push_str(&format!(
            "{indent}Click(\"{}\")\n",
            ahk_quote(&action.value)
        )),
        "ahk" => {
            for line in action.value.lines() {
                script.push_str(&format!("{indent}{line}\n"));
            }
        }
        _ => {}
    }
}

fn write_action_dispatcher(
    script: &mut String,
    group_targets: &[&Target],
    global_targets: &[&Target],
) {
    script.push_str("; Action Dispatcher (3. Disabled > 2. Groups > 1. Global)\n");
    script.push_str("GeneratedDispatchGestureAction(trigger, stepStr, procName) {\n");
    script.push_str("    pLower := StrLower(procName)\n\n");

    // Priority 2: Groups
    for target in group_targets {
        let executables = target_executables(target);
        if executables.is_empty() || target.bindings.is_empty() {
            continue;
        }

        script.push_str(&format!("    ; Group: {}\n", target.name));
        script.push_str(&format!("    if ({}) {{\n", app_condition(&executables)));
        for binding in ordered_gesture_bindings(target) {
            let trigger = trigger_to_ahk_name(&binding.gesture.trigger);
            let steps = binding.gesture.steps.join(",");
            script.push_str(&format!(
                "        if (GestureTriggerMatches(trigger, \"{}\") && stepStr = \"{}\") {{\n",
                trigger, steps
            ));
            write_dispatch_action(script, &binding.action, "            ");
            script.push_str("            return true\n");
            script.push_str("        }\n");
        }
        script.push_str("    }\n\n");
    }

    // Priority 1: Global
    for target in global_targets {
        script.push_str("    ; Priority 1: Global Fallback\n");
        for binding in ordered_gesture_bindings(target) {
            let trigger = trigger_to_ahk_name(&binding.gesture.trigger);
            let steps = binding.gesture.steps.join(",");
            script.push_str(&format!(
                "    if (GestureTriggerMatches(trigger, \"{}\") && stepStr = \"{}\") {{\n",
                trigger, steps
            ));
            write_dispatch_action(script, &binding.action, "        ");
            script.push_str("        return true\n");
            script.push_str("    }\n");
        }
    }

    script.push_str("    return false\n");
    script.push_str("}\n\n");
}

fn write_action_name_getter(
    script: &mut String,
    config: &AppConfig,
    group_targets: &[&Target],
    global_targets: &[&Target],
) {
    script.push_str("; Action Name Query for OSD Tip\n");
    script.push_str("GeneratedGetGestureActionName(trigger, stepStr, procName) {\n");
    script.push_str("    pLower := StrLower(procName)\n\n");

    for target in group_targets {
        let executables = target_executables(target);
        if executables.is_empty() || target.bindings.is_empty() {
            continue;
        }

        script.push_str(&format!("    if ({}) {{\n", app_condition(&executables)));
        for binding in ordered_gesture_bindings(target) {
            let trigger = trigger_to_ahk_name(&binding.gesture.trigger);
            let steps = binding.gesture.steps.join(",");
            let name = resolve_action_display_name(
                &binding.action.id,
                &binding.action.name,
                &config.language,
            );
            script.push_str(&format!(
                "        if (GestureTriggerMatches(trigger, \"{}\") && stepStr = \"{}\")\n",
                trigger, steps
            ));
            script.push_str(&format!("            return \"{}\"\n", ahk_quote(&name)));
        }
        script.push_str("    }\n\n");
    }

    for target in global_targets {
        for binding in ordered_gesture_bindings(target) {
            let trigger = trigger_to_ahk_name(&binding.gesture.trigger);
            let steps = binding.gesture.steps.join(",");
            let name = resolve_action_display_name(
                &binding.action.id,
                &binding.action.name,
                &config.language,
            );
            script.push_str(&format!(
                "    if (GestureTriggerMatches(trigger, \"{}\") && stepStr = \"{}\")\n",
                trigger, steps
            ));
            script.push_str(&format!("        return \"{}\"\n", ahk_quote(&name)));
        }
    }

    script.push_str("    return \"\"\n");
    script.push_str("}\n");
}

fn write_keyboard_rules(
    script: &mut String,
    config: &AppConfig,
    group_targets: &[&Target],
    global_targets: &[&Target],
    disabled_executables: &[String],
) {
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

    if keyboard_triggers.is_empty() {
        return;
    }

    script.push_str(
        "\n; ------------------------------------------------------------------------------\n",
    );
    script.push_str("; Context-sensitive keyboard rules\n");
    script.push_str(
        "; ------------------------------------------------------------------------------\n",
    );
    write_keyboard_helpers(script);

    for executable in disabled_executables {
        script.push_str(&format!(
            "GroupAdd(\"GeneratedDisabledApps\", \"ahk_exe {}\")\n",
            ahk_quote(executable)
        ));
    }
    script.push('\n');

    for (index, target) in group_targets.iter().enumerate() {
        if !target.bindings.iter().any(is_keyboard_binding) {
            continue;
        }
        for executable in target
            .executables
            .iter()
            .map(|executable| executable.trim())
            .filter(|executable| !executable.is_empty())
        {
            script.push_str(&format!(
                "GroupAdd(\"GeneratedKeyboardGroup{}\", \"ahk_exe {}\")\n",
                index,
                ahk_quote(executable)
            ));
        }
    }
    script.push('\n');
    script.push_str("#InputLevel 1\n");

    script.push_str("#HotIf WinActive(\"ahk_group GeneratedDisabledApps\")\n");
    for trigger in &keyboard_triggers {
        script.push_str(&format!("~*{}::return\n", trigger));
    }

    for (index, target) in group_targets.iter().enumerate() {
        if !target.bindings.iter().any(is_keyboard_binding) {
            continue;
        }
        script.push_str(&format!(
            "#HotIf WinActive(\"ahk_group GeneratedKeyboardGroup{}\")\n",
            index
        ));
        let mut emitted_triggers = HashSet::new();
        write_target_hotkeys(script, target, &mut emitted_triggers);
    }

    script.push_str("#HotIf\n");
    let mut global_triggers = HashSet::new();
    for target in global_targets {
        write_target_hotkeys(script, target, &mut global_triggers);
    }

    for remap in config.key_remaps.iter().filter(|remap| remap.enabled) {
        let source = remap.src_key.trim();
        let destination = remap.dst_key.trim();
        if source.is_empty() || !global_triggers.insert(source.to_ascii_lowercase()) {
            continue;
        }
        if destination.eq_ignore_ascii_case("none") || destination.eq_ignore_ascii_case("disabled")
        {
            script.push_str(&format!("*{}::return\n", source));
        } else if !destination.is_empty() {
            script.push_str(&format!(
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
        script.push_str(&format!(
            "*{} up::GeneratedRemapKeyUp(\"{}\")\n",
            trigger,
            ahk_quote(trigger)
        ));
    }
    script.push_str("#InputLevel 0\n");
}

pub fn generate_ahk_script(config: &AppConfig, revision: u64) -> String {
    let mut script = String::new();
    write_header(&mut script, config, revision);

    let disabled_executables = collect_disabled_executables(config);
    write_disabled_process_function(&mut script, &disabled_executables);

    let group_targets = enabled_targets(config, "group");
    let global_targets = enabled_targets(config, "global");
    write_action_dispatcher(&mut script, &group_targets, &global_targets);
    write_action_name_getter(&mut script, config, &group_targets, &global_targets);
    write_keyboard_rules(
        &mut script,
        config,
        &group_targets,
        &global_targets,
        &disabled_executables,
    );

    script
}

#[cfg(test)]
mod tests {
    #[test]
    fn half_edges_are_gestures_and_precede_whole_edges_within_each_scope() {
        let mut config = crate::config::default_app_config();
        let target = config
            .targets
            .iter_mut()
            .find(|target| target.kind == "group")
            .unwrap();
        let mut whole = keyboard_binding("whole", "EdgeTop", "noop", "");
        whole.gesture.steps = vec!["WU".into()];
        let mut half = keyboard_binding("half", "EdgeTopLeftHalf", "noop", "");
        half.gesture.steps = vec!["WU".into()];
        target.bindings = vec![whole, half];
        let script = super::generate_ahk_script(&config, 1);
        let half_pos = script
            .find("GestureTriggerMatches(trigger, \"EdgeTopLeftHalf\")")
            .unwrap();
        let whole_pos = script
            .find("GestureTriggerMatches(trigger, \"EdgeTop\")")
            .unwrap();
        assert!(half_pos < whole_pos);
        assert!(super::is_mouse_or_spatial_trigger("EdgeRightBottomHalf"));
        assert!(!script.contains("*EdgeTopLeftHalf::"));
    }
    #[test]
    fn mouse_chords_are_canonical_gestures_not_keyboard_hotkeys() {
        let mut config = crate::config::default_app_config();
        let binding = keyboard_binding("chord", "X1+R", "keys", "^w");
        config
            .targets
            .iter_mut()
            .find(|target| target.kind == "global")
            .unwrap()
            .bindings
            .push(binding);
        let script = super::generate_ahk_script(&config, 1);
        assert!(super::is_mouse_or_spatial_trigger("X1+R"));
        assert_eq!(super::trigger_to_ahk_name("X1+R"), "RButton+XButton1");
        assert!(script.contains("\"RButton+XButton1\""));
        assert!(!script.contains("*X1+R::"));
        assert!(script.contains("SetMouseTriggers(["));
    }
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
    fn test_osd_settings_are_emitted() {
        let mut cfg = default_app_config();
        cfg.engine.osd_duration_ms = 1500;
        cfg.engine.osd_font_size_px = 25;
        cfg.engine.osd_opacity_pct = 60;
        let script = generate_ahk_script(&cfg, 1);

        assert!(script.contains("global gOsdDurationMs := 1500"));
        assert!(script.contains("global gOsdFontSizePx := 25"));
        assert!(script.contains("global gOsdOpacityPct := 60"));
        assert!(script.contains("global gOsdUnknownGestureLabel := \"未知手勢\""));

        cfg.language = "en".into();
        cfg.engine.osd_duration_ms = 0;
        let script = generate_ahk_script(&cfg, 2);

        assert!(script.contains("global gOsdDurationMs := 0"));
        assert!(script.contains("global gOsdUnknownGestureLabel := \"Unknown Gesture\""));
    }

    #[test]
    fn test_target_bindings_with_keyboard_triggers_emitted_when_enabled() {
        let mut cfg = default_app_config();
        if let Some(gt) = cfg.targets.iter_mut().find(|t| t.kind == "global") {
            gt.bindings
                .push(keyboard_binding("insert", "Insert", "noop", ""));
            gt.bindings
                .push(keyboard_binding("lalt", "LAlt", "remap", "LWin"));
            gt.bindings
                .push(keyboard_binding("lwin", "LWin", "remap", "LAlt"));
        }
        let script = generate_ahk_script(&cfg, 2);
        assert!(script.contains("#InputLevel 1"));
        assert!(script.contains("*Insert::return"));
        assert!(script.contains("*LAlt::GeneratedRemapKeyDown(\"LAlt\", \"LWin\")"));
        assert!(script.contains("*LAlt up::GeneratedRemapKeyUp(\"LAlt\")"));
        assert!(script.contains("*LWin::GeneratedRemapKeyDown(\"LWin\", \"LAlt\")"));
        assert!(script.contains("*LWin up::GeneratedRemapKeyUp(\"LWin\")"));
        assert!(!script.contains("~*LAlt up::"));
        assert!(!script.contains("~*LWin up::"));
        assert!(!script.contains("~*Insert up::"));

        let dispatcher_start = script
            .find("GeneratedDispatchGestureAction(trigger")
            .expect("gesture dispatcher should be generated");
        let dispatcher_end = script[dispatcher_start..]
            .find("; Action Name Query")
            .map(|position| position + dispatcher_start)
            .expect("gesture dispatcher should have an end marker");
        assert!(!script[dispatcher_start..dispatcher_end]
            .contains("GestureTriggerMatches(trigger, \"Insert\")"));
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
        for target in cfg
            .targets
            .iter_mut()
            .filter(|target| target.kind == "global")
        {
            for key in ["-", "=", "[", "]", "\\", ";", "'", ",", ".", "/"] {
                for prefix in ["", "^+"] {
                    let trigger = format!("{prefix}{key}");
                    target
                        .bindings
                        .push(keyboard_binding(&trigger, &trigger, "noop", ""));
                }
            }
        }
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
            "conductor-keyboard-test-{}-{timestamp}",
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
