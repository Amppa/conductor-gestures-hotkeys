use serde::{Deserialize, Deserializer, Serialize};

/// Persisted configuration format version. Bump only when the on-disk shape changes.
pub const CURRENT_CONFIG_VERSION: u8 = 1;

// -----------------------------------------------------------------------------
// Data Types Matching Config Schema
// -----------------------------------------------------------------------------
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub version: u8,
    pub language: String,
    pub engine: EngineConfig,
    pub edge_scroll: EdgeScrollConfig,
    pub gesture_templates: Vec<GestureTemplate>,
    pub action_templates: Vec<ActionTemplate>,
    #[serde(default)]
    pub key_remaps: Vec<KeyRemap>,
    pub targets: Vec<Target>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyRemap {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub src_key: String,
    pub dst_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineConfig {
    pub enabled: bool,
    pub debug: bool,
    pub threshold_px: i32,
    #[serde(
        default = "default_osd_duration_ms",
        deserialize_with = "deserialize_osd_duration_ms"
    )]
    pub osd_duration_ms: u32,
    #[serde(
        default = "default_osd_font_size_px",
        alias = "osdFontSizePt",
        deserialize_with = "deserialize_osd_font_size_px"
    )]
    pub osd_font_size_px: u32,
    #[serde(
        default = "default_osd_opacity_pct",
        deserialize_with = "deserialize_osd_opacity_pct"
    )]
    pub osd_opacity_pct: u32,
}

fn default_osd_duration_ms() -> u32 {
    1000
}

pub(crate) fn normalize_osd_duration_ms(value: u32) -> u32 {
    ((value.min(2000) + 250) / 500) * 500
}

fn deserialize_osd_duration_ms<'de, D>(deserializer: D) -> Result<u32, D::Error>
where
    D: Deserializer<'de>,
{
    u32::deserialize(deserializer).map(normalize_osd_duration_ms)
}

fn default_osd_font_size_px() -> u32 {
    20
}

pub(crate) fn normalize_osd_font_size_px(value: u32) -> u32 {
    ((value.clamp(15, 25) - 15 + 2) / 5) * 5 + 15
}

fn deserialize_osd_font_size_px<'de, D>(deserializer: D) -> Result<u32, D::Error>
where
    D: Deserializer<'de>,
{
    u32::deserialize(deserializer).map(normalize_osd_font_size_px)
}

fn default_osd_opacity_pct() -> u32 {
    90
}

pub(crate) fn normalize_osd_opacity_pct(value: u32) -> u32 {
    ((value.min(100) + 5) / 10) * 10
}

fn deserialize_osd_opacity_pct<'de, D>(deserializer: D) -> Result<u32, D::Error>
where
    D: Deserializer<'de>,
{
    u32::deserialize(deserializer).map(normalize_osd_opacity_pct)
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EdgeScrollConfig {
    pub enabled: bool,
    pub top_edge: bool,
    pub action: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct GestureTemplate {
    pub id: String,
    #[serde(default, skip_serializing)]
    pub name: String,
    pub trigger: String,
    pub steps: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionTemplate {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub action_type: String,
    pub value: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Target {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub kind: String, // "disabled" | "group" | "global"
    pub executables: Vec<String>,
    pub bindings: Vec<Binding>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Binding {
    pub id: String,
    pub enabled: bool,
    pub gesture: Gesture,
    pub action: Action,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Gesture {
    pub id: String,
    #[serde(default, skip_serializing)]
    pub name: String,
    pub trigger: String,
    pub steps: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Action {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub action_type: String,
    pub value: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyResult {
    pub success: bool,
    pub revision: u64,
    pub msg: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStatus {
    pub state: String,
    pub applied_revision: Option<u64>,
    pub msg: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessItem {
    pub name: String,
    pub exe: String,
}

fn default_engine_config() -> EngineConfig {
    EngineConfig {
        enabled: true,
        debug: false,
        threshold_px: 10,
        osd_duration_ms: default_osd_duration_ms(),
        osd_font_size_px: default_osd_font_size_px(),
        osd_opacity_pct: default_osd_opacity_pct(),
    }
}

fn default_edge_scroll_config() -> EdgeScrollConfig {
    EdgeScrollConfig {
        enabled: true,
        top_edge: true,
        action: "volume".into(),
    }
}

fn gesture_template(id: &str, name: &str, trigger: &str, steps: &[&str]) -> GestureTemplate {
    GestureTemplate {
        id: id.into(),
        name: name.into(),
        trigger: trigger.into(),
        steps: steps.iter().map(|step| (*step).into()).collect(),
    }
}

fn default_gesture_templates() -> Vec<GestureTemplate> {
    vec![
        gesture_template("edge-top-wu", "Top Edge Wheel Up", "EdgeTop", &["WU"]),
        gesture_template("edge-top-wd", "Top Edge Wheel Down", "EdgeTop", &["WD"]),
        gesture_template(
            "edge-bottom-wu",
            "Bottom Edge Wheel Up",
            "EdgeBottom",
            &["WU"],
        ),
        gesture_template(
            "edge-bottom-wd",
            "Bottom Edge Wheel Down",
            "EdgeBottom",
            &["WD"],
        ),
        gesture_template("edge-left-wu", "Left Edge Wheel Up", "EdgeLeft", &["WU"]),
        gesture_template("edge-left-wd", "Left Edge Wheel Down", "EdgeLeft", &["WD"]),
        gesture_template("edge-right-wu", "Right Edge Wheel Up", "EdgeRight", &["WU"]),
        gesture_template(
            "edge-right-wd",
            "Right Edge Wheel Down",
            "EdgeRight",
            &["WD"],
        ),
        gesture_template("edge-top-left-wu", "", "EdgeTopLeftHalf", &["WU"]),
        gesture_template("edge-top-left-wd", "", "EdgeTopLeftHalf", &["WD"]),
        gesture_template("edge-top-right-wu", "", "EdgeTopRightHalf", &["WU"]),
        gesture_template("edge-top-right-wd", "", "EdgeTopRightHalf", &["WD"]),
        gesture_template("edge-bottom-left-wu", "", "EdgeBottomLeftHalf", &["WU"]),
        gesture_template("edge-bottom-left-wd", "", "EdgeBottomLeftHalf", &["WD"]),
        gesture_template("edge-bottom-right-wu", "", "EdgeBottomRightHalf", &["WU"]),
        gesture_template("edge-bottom-right-wd", "", "EdgeBottomRightHalf", &["WD"]),
        gesture_template("edge-left-top-wu", "", "EdgeLeftTopHalf", &["WU"]),
        gesture_template("edge-left-top-wd", "", "EdgeLeftTopHalf", &["WD"]),
        gesture_template("edge-left-bottom-wu", "", "EdgeLeftBottomHalf", &["WU"]),
        gesture_template("edge-left-bottom-wd", "", "EdgeLeftBottomHalf", &["WD"]),
        gesture_template("edge-right-top-wu", "", "EdgeRightTopHalf", &["WU"]),
        gesture_template("edge-right-top-wd", "", "EdgeRightTopHalf", &["WD"]),
        gesture_template("edge-right-bottom-wu", "", "EdgeRightBottomHalf", &["WU"]),
        gesture_template("edge-right-bottom-wd", "", "EdgeRightBottomHalf", &["WD"]),
        gesture_template("corner-tl", "Corner TL", "CornerTL", &[]),
        gesture_template("corner-tr", "Corner TR", "CornerTR", &[]),
        gesture_template("corner-bl", "Corner BL", "CornerBL", &[]),
        gesture_template("r-diagonal-ul", "Right Button Up-Left", "R", &["UL"]),
        gesture_template("r-diagonal-ur", "Right Button Up-Right", "R", &["UR"]),
        gesture_template("r-diagonal-dr", "Right Button Down-Right", "R", &["DR"]),
        gesture_template("r-diagonal-dl", "Right Button Down-Left", "R", &["DL"]),
        gesture_template("r-left", "Left", "R", &["L"]),
        gesture_template("r-right", "Right", "R", &["R"]),
        gesture_template("r-up", "Up", "R", &["U"]),
        gesture_template("r-down", "Down", "R", &["D"]),
        gesture_template("r-right-down", "Right-Down", "R", &["R", "D"]),
        gesture_template("r-right-up", "Right-Up", "R", &["R", "U"]),
        gesture_template("r-left-down", "Left-Down", "R", &["L", "D"]),
        gesture_template("r-left-up", "Left-Up", "R", &["L", "U"]),
        gesture_template("x1-click", "X1 Click", "X1", &[]),
        gesture_template("x2-click", "X2 Click", "X2", &[]),
        gesture_template("r-x2-click", "R+X2", "R+X2", &[]),
        gesture_template("r-x1-click", "R+X1", "R+X1", &[]),
        gesture_template("r-wu", "R + Wheel Up", "R", &["WU"]),
        gesture_template("r-wd", "R + Wheel Down", "R", &["WD"]),
        gesture_template("corner-br", "Bottom-Right Corner", "CornerBR", &[]),
        gesture_template("key-insert", "Insert Key", "Insert", &[]),
        gesture_template("key-numlock", "Num Lock", "NumLock", &[]),
        gesture_template("key-numpad0", "Numpad 0", "Numpad0", &[]),
        gesture_template("key-numpad1", "Numpad 1", "Numpad1", &[]),
        gesture_template("key-numpad2", "Numpad 2", "Numpad2", &[]),
        gesture_template("key-numpad3", "Numpad 3", "Numpad3", &[]),
        gesture_template("key-numpad4", "Numpad 4", "Numpad4", &[]),
        gesture_template("key-numpad5", "Numpad 5", "Numpad5", &[]),
        gesture_template("key-numpad6", "Numpad 6", "Numpad6", &[]),
        gesture_template("key-numpad7", "Numpad 7", "Numpad7", &[]),
        gesture_template("key-numpad8", "Numpad 8", "Numpad8", &[]),
        gesture_template("key-numpad9", "Numpad 9", "Numpad9", &[]),
        gesture_template("key-numpad-div", "Numpad Divide", "NumpadDiv", &[]),
        gesture_template("key-numpad-mult", "Numpad Multiply", "NumpadMult", &[]),
        gesture_template("key-numpad-sub", "Numpad Subtract", "NumpadSub", &[]),
        gesture_template("key-numpad-add", "Numpad Add", "NumpadAdd", &[]),
        gesture_template("key-numpad-dot", "Numpad Decimal", "NumpadDot", &[]),
        gesture_template("key-numpad-enter", "Numpad Enter", "NumpadEnter", &[]),
    ]
}

fn action_template(id: &str, name: &str, action_type: &str, value: &str) -> ActionTemplate {
    ActionTemplate {
        id: id.into(),
        name: name.into(),
        action_type: action_type.into(),
        value: value.into(),
    }
}

fn default_action_templates() -> Vec<ActionTemplate> {
    vec![
        action_template("act-back", "Back", "keys", "!{Left}"),
        action_template("act-forward", "Forward", "keys", "!{Right}"),
        action_template("act-close-tab", "Close Tab", "keys", "^w"),
        action_template("act-reopen-tab", "Reopen Closed Tab", "keys", "^+t"),
        action_template("act-minimize", "Minimize Window", "ahk", "WinMinimize('A')"),
        action_template("act-show-desktop", "Show Desktop", "keys", "#d"),
        action_template("act-vol-up", "Volume Up", "keys", "{Volume_Up}"),
        action_template("act-vol-down", "Volume Down", "keys", "{Volume_Down}"),
        action_template("act-prev-tab", "Previous Tab", "keys", "^{PgUp}"),
        action_template("act-next-tab", "Next Tab", "keys", "^{PgDn}"),
        action_template("act-noop", "No-op (Mute)", "noop", ""),
        action_template("act-paste-plain", "Paste Plain Text", "keys", "^+v"),
        action_template("act-select-line", "Select Line", "ahk", "Send('{Home}+{End}')"),
        action_template("act-delete-confirm", "Delete & Confirm", "ahk", "Send('{Delete}')\nSleep(150)\nSend('y')"),
        action_template("act-page-top", "Go to Top", "keys", "^{Home}"),
        action_template("act-page-bottom", "Go to Bottom", "keys", "^{End}"),
        action_template("act-mute", "Toggle Mute", "keys", "{Volume_Mute}"),
        action_template("act-play-pause", "Play / Pause", "keys", "{Media_Play_Pause}"),
        action_template("act-media-prev", "Previous Track", "keys", "{Media_Prev}"),
        action_template("act-media-next", "Next Track", "keys", "{Media_Next}"),
        action_template("act-screenshot-region", "Region Screenshot", "keys", "#+s"),
        action_template("act-switch-ime", "Switch Input Method", "keys", "#{Space}"),
        action_template("act-toggle-ime", "Toggle IME (Ctrl+Space)", "keys", "^{Space}"),
        action_template("act-open-calc", "Open Calculator", "run", "calc.exe"),
        action_template("act-open-notepad", "Open Notepad", "run", "notepad.exe"),
    ]
}

fn key_remap(id: &str, name: &str, enabled: bool, src_key: &str, dst_key: &str) -> KeyRemap {
    KeyRemap {
        id: id.into(),
        name: name.into(),
        enabled,
        src_key: src_key.into(),
        dst_key: dst_key.into(),
    }
}

fn default_key_remaps() -> Vec<KeyRemap> {
    vec![
        key_remap(
            "remap-disable-insert",
            "停用 Insert 鍵 (靜音)",
            false,
            "Insert",
            "none",
        ),
        key_remap(
            "remap-lalt-lwin",
            "左 Alt 映射為 Win",
            false,
            "LAlt",
            "LWin",
        ),
        key_remap(
            "remap-lwin-lalt",
            "左 Win 映射為 Alt",
            false,
            "LWin",
            "LAlt",
        ),
    ]
}

fn gesture(id: &str, name: &str, trigger: &str, steps: &[&str]) -> Gesture {
    Gesture {
        id: id.into(),
        name: name.into(),
        trigger: trigger.into(),
        steps: steps.iter().map(|step| (*step).into()).collect(),
    }
}

fn action(id: &str, name: &str, action_type: &str, value: &str) -> Action {
    Action {
        id: id.into(),
        name: name.into(),
        action_type: action_type.into(),
        value: value.into(),
    }
}

fn binding(id: &str, enabled: bool, gesture: Gesture, action: Action) -> Binding {
    Binding {
        id: id.into(),
        enabled,
        gesture,
        action,
    }
}

fn target(
    id: &str,
    name: &str,
    kind: &str,
    executables: &[&str],
    bindings: Vec<Binding>,
) -> Target {
    Target {
        id: id.into(),
        name: name.into(),
        enabled: true,
        kind: kind.into(),
        executables: executables.iter().map(|exe| (*exe).into()).collect(),
        bindings,
    }
}

fn default_targets() -> Vec<Target> {
    vec![
        target(
            "disabled",
            "Disabled List (Bypass)",
            "disabled",
            &["conductor.exe", "photoshop.exe"],
            vec![],
        ),
        target(
            "group01",
            "Group 01",
            "group",
            &["chrome.exe", "msedge.exe", "firefox.exe", "brave.exe"],
            vec![
                binding(
                    "b-close-tab",
                    true,
                    gesture("r-right-down", "Right-Down", "R", &["R", "D"]),
                    action("act-close-tab", "Close Tab", "keys", "^w"),
                ),
                binding(
                    "b-reopen-tab",
                    true,
                    gesture("r-right-up", "Right-Up", "R", &["R", "U"]),
                    action("act-reopen-tab", "Reopen Closed Tab", "keys", "^+t"),
                ),
                binding(
                    "g-edge-top-prev-tab",
                    true,
                    gesture("edge-top-wu", "Top Edge Wheel Up", "EdgeTop", &["WU"]),
                    action("act-prev-tab", "Previous Tab", "keys", "^{PgUp}"),
                ),
                binding(
                    "g-edge-top-next-tab",
                    true,
                    gesture("edge-top-wd", "Top Edge Wheel Down", "EdgeTop", &["WD"]),
                    action("act-next-tab", "Next Tab", "keys", "^{PgDn}"),
                ),
            ],
        ),
        target(
            "global",
            "Global Default",
            "global",
            &[],
            vec![
                binding(
                    "g-back",
                    true,
                    gesture("r-left", "Left", "R", &["L"]),
                    action("act-back", "Back", "keys", "!{Left}"),
                ),
                binding(
                    "g-forward",
                    true,
                    gesture("r-right", "Right", "R", &["R"]),
                    action("act-forward", "Forward", "keys", "!{Right}"),
                ),
                binding(
                    "g-edge-left-vol-up",
                    true,
                    gesture("edge-left-wu", "Left Edge Wheel Up", "EdgeLeft", &["WU"]),
                    action("act-vol-up", "Volume Up", "keys", "{Volume_Up}"),
                ),
                binding(
                    "g-edge-left-vol-down",
                    true,
                    gesture("edge-left-wd", "Left Edge Wheel Down", "EdgeLeft", &["WD"]),
                    action("act-vol-down", "Volume Down", "keys", "{Volume_Down}"),
                ),
                binding(
                    "g-corner-br",
                    false,
                    gesture("corner-br", "Bottom-Right Corner", "CornerBR", &[]),
                    action("act-show-desktop", "Show Desktop", "keys", "#d"),
                ),
                binding(
                    "g-insert-mute",
                    false,
                    gesture("key-insert", "Insert", "Insert", &[]),
                    action("act-noop", "No-op (Mute)", "noop", ""),
                ),
            ],
        ),
    ]
}

pub fn default_app_config() -> AppConfig {
    AppConfig {
        version: CURRENT_CONFIG_VERSION,
        language: "zh-TW".into(),
        engine: default_engine_config(),
        edge_scroll: default_edge_scroll_config(),
        gesture_templates: default_gesture_templates(),
        action_templates: default_action_templates(),
        key_remaps: default_key_remaps(),
        targets: default_targets(),
    }
}

/// Maps legacy trigger aliases to their canonical token.
pub(crate) fn normalize_trigger(trigger: &str) -> String {
    let buttons = trigger.split('+').collect::<Vec<_>>();
    let order = ["L", "M", "R", "X1", "X2"];
    if buttons.len() > 1 && buttons.iter().all(|key| order.contains(key)) {
        return order
            .into_iter()
            .filter(|key| buttons.contains(key))
            .collect::<Vec<_>>()
            .join("+");
    }
    match trigger {
        "RB" | "RButton" => "R".into(),
        "MB" | "MButton" => "M".into(),
        "LB" | "LButton" => "L".into(),
        "X1B" | "XButton1" => "X1".into(),
        "X2B" | "XButton2" => "X2".into(),
        "EdgeTopL" | "EdgeTopR" => "EdgeTop".into(),
        other => other.to_string(),
    }
}

pub(crate) fn supported_mouse_trigger(trigger: &str, steps: &[String]) -> bool {
    let keys = trigger.split('+').collect::<Vec<_>>();
    if !keys
        .iter()
        .all(|key| ["L", "M", "R", "X1", "X2"].contains(key))
    {
        return true;
    }
    if trigger == "L" {
        return false;
    }
    if steps.is_empty() {
        return keys.len() > 1 || ["X1", "X2"].contains(&trigger);
    }
    if keys.len() > 1 || trigger == "M" {
        return false;
    }
    if steps.len() == 1 && ["WU", "WD"].contains(&steps[0].as_str()) {
        return true;
    }
    steps
        .iter()
        .all(|step| ["U", "D", "L", "R", "UL", "UR", "DL", "DR"].contains(&step.as_str()))
}

/// Normalizes every persisted trigger without changing template or rule identity.
pub(crate) fn normalize_config_triggers(config: &mut AppConfig) {
    for template in &mut config.gesture_templates {
        template.trigger = normalize_trigger(&template.trigger);
    }
    for target in &mut config.targets {
        for binding in &mut target.bindings {
            binding.gesture.trigger = normalize_trigger(&binding.gesture.trigger);
        }
        target.bindings.retain(|binding| {
            supported_mouse_trigger(&binding.gesture.trigger, &binding.gesture.steps)
        });
    }
    config
        .gesture_templates
        .retain(|template| supported_mouse_trigger(&template.trigger, &template.steps));
}

#[cfg(test)]
mod tests {
    #[test]
    fn removes_obsolete_mouse_combinations_and_mixed_wheel_rules() {
        let mut config = default_app_config();
        config
            .gesture_templates
            .push(gesture_template("mixed", "", "R", &["D", "WU"]));
        config
            .gesture_templates
            .push(gesture_template("chord", "", "R+X1", &["D"]));
        let group = config
            .targets
            .iter_mut()
            .find(|target| target.kind == "global")
            .unwrap();
        let mut invalid = group.bindings[0].clone();
        invalid.id = "obsolete".into();
        invalid.gesture.trigger = "R+X1".into();
        group.bindings.push(invalid);
        normalize_config_triggers(&mut config);
        assert!(!config
            .gesture_templates
            .iter()
            .any(|template| ["mixed", "chord"].contains(&template.id.as_str())));
        assert!(!config
            .targets
            .iter()
            .flat_map(|target| &target.bindings)
            .any(|binding| binding.id == "obsolete"));
        assert!(supported_mouse_trigger("R+X1", &[]));
        assert!(!supported_mouse_trigger("M", &["WU".into()]));
        assert!(supported_mouse_trigger("M+R", &[]));
        assert!(!supported_mouse_trigger("R", &["WU".into(), "WD".into()]));
    }
    use super::*;

    #[test]
    fn default_trigger_templates_match_the_frontend_catalog() {
        let config = default_app_config();
        let ids = config
            .gesture_templates
            .iter()
            .map(|template| template.id.as_str())
            .collect::<Vec<_>>();

        assert_eq!(
            ids,
            vec![
                "edge-top-wu",
                "edge-top-wd",
                "edge-bottom-wu",
                "edge-bottom-wd",
                "edge-left-wu",
                "edge-left-wd",
                "edge-right-wu",
                "edge-right-wd",
                "edge-top-left-wu",
                "edge-top-left-wd",
                "edge-top-right-wu",
                "edge-top-right-wd",
                "edge-bottom-left-wu",
                "edge-bottom-left-wd",
                "edge-bottom-right-wu",
                "edge-bottom-right-wd",
                "edge-left-top-wu",
                "edge-left-top-wd",
                "edge-left-bottom-wu",
                "edge-left-bottom-wd",
                "edge-right-top-wu",
                "edge-right-top-wd",
                "edge-right-bottom-wu",
                "edge-right-bottom-wd",
                "corner-tl",
                "corner-tr",
                "corner-bl",
                "r-diagonal-ul",
                "r-diagonal-ur",
                "r-diagonal-dr",
                "r-diagonal-dl",
                "r-left",
                "r-right",
                "r-up",
                "r-down",
                "r-right-down",
                "r-right-up",
                "r-left-down",
                "r-left-up",
                "x1-click",
                "x2-click",
                "r-x2-click",
                "r-x1-click",
                "r-wu",
                "r-wd",
                "corner-br",
                "key-insert",
                "key-numlock",
                "key-numpad0",
                "key-numpad1",
                "key-numpad2",
                "key-numpad3",
                "key-numpad4",
                "key-numpad5",
                "key-numpad6",
                "key-numpad7",
                "key-numpad8",
                "key-numpad9",
                "key-numpad-div",
                "key-numpad-mult",
                "key-numpad-sub",
                "key-numpad-add",
                "key-numpad-dot",
                "key-numpad-enter",
            ]
        );
    }

    #[test]
    fn default_rules_do_not_include_left_alt_or_left_win_remaps() {
        let config = default_app_config();
        let global_target = config
            .targets
            .iter()
            .find(|target| target.kind == "global")
            .expect("default config should have a global target");
        let ids = global_target
            .bindings
            .iter()
            .map(|binding| binding.id.as_str())
            .collect::<Vec<_>>();

        assert!(!ids.contains(&"g-lalt-to-lwin"));
        assert!(!ids.contains(&"g-lwin-to-lalt"));
    }

    #[test]
    fn default_browser_group_has_swapped_top_edge_tab_rules() {
        let config = default_app_config();
        let browser_group = config
            .targets
            .iter()
            .find(|target| target.id == "group01")
            .expect("default config should have a browser group");
        let global_target = config
            .targets
            .iter()
            .find(|target| target.kind == "global")
            .expect("default config should have a global target");
        let previous_tab = browser_group
            .bindings
            .iter()
            .find(|binding| binding.id == "g-edge-top-prev-tab")
            .expect("browser group should have previous-tab rule");
        let next_tab = browser_group
            .bindings
            .iter()
            .find(|binding| binding.id == "g-edge-top-next-tab")
            .expect("browser group should have next-tab rule");
        let close_tab = browser_group
            .bindings
            .iter()
            .find(|binding| binding.id == "b-close-tab")
            .expect("browser group should have close-tab rule");
        let reopen_tab = browser_group
            .bindings
            .iter()
            .find(|binding| binding.id == "b-reopen-tab")
            .expect("browser group should have reopen-tab rule");

        assert_eq!(close_tab.gesture.steps, vec!["R", "D"]);
        assert_eq!(reopen_tab.gesture.steps, vec!["R", "U"]);
        assert_eq!(previous_tab.gesture.steps, vec!["WU"]);
        assert_eq!(next_tab.gesture.steps, vec!["WD"]);
        assert!(!global_target
            .bindings
            .iter()
            .any(|binding| binding.id == "g-edge-top-prev-tab"));
        assert!(!global_target
            .bindings
            .iter()
            .any(|binding| binding.id == "g-edge-top-next-tab"));
    }

    #[test]
    fn missing_osd_duration_uses_default() {
        let mut value =
            serde_json::to_value(default_app_config()).expect("config should serialize");
        value["engine"]
            .as_object_mut()
            .expect("engine should be an object")
            .remove("osdDurationMs");

        let config: AppConfig = serde_json::from_value(value).expect("legacy config should load");

        assert_eq!(config.engine.osd_duration_ms, 1000);
    }

    #[test]
    fn osd_duration_is_normalized_to_supported_steps() {
        let mut value =
            serde_json::to_value(default_app_config()).expect("config should serialize");
        value["engine"]["osdDurationMs"] = serde_json::json!(300);

        let config: AppConfig = serde_json::from_value(value).expect("config should load");

        assert_eq!(config.engine.osd_duration_ms, 500);
    }

    #[test]
    fn missing_osd_font_size_uses_default() {
        let mut value =
            serde_json::to_value(default_app_config()).expect("config should serialize");
        value["engine"]
            .as_object_mut()
            .expect("engine should be an object")
            .remove("osdFontSizePx");

        let config: AppConfig = serde_json::from_value(value).expect("legacy config should load");

        assert_eq!(config.engine.osd_font_size_px, 20);
    }

    #[test]
    fn osd_font_size_is_normalized_to_supported_steps() {
        let mut value =
            serde_json::to_value(default_app_config()).expect("config should serialize");
        value["engine"]["osdFontSizePx"] = serde_json::json!(24);

        let config: AppConfig = serde_json::from_value(value).expect("config should load");

        assert_eq!(config.engine.osd_font_size_px, 25);
    }

    #[test]
    fn legacy_osd_font_size_field_is_supported() {
        let mut value =
            serde_json::to_value(default_app_config()).expect("config should serialize");
        let engine = value["engine"]
            .as_object_mut()
            .expect("engine should be an object");
        engine.remove("osdFontSizePx");
        engine.insert("osdFontSizePt".into(), serde_json::json!(24));

        let config: AppConfig = serde_json::from_value(value).expect("legacy config should load");

        assert_eq!(config.engine.osd_font_size_px, 25);
    }

    #[test]
    fn missing_osd_opacity_uses_default() {
        let mut value =
            serde_json::to_value(default_app_config()).expect("config should serialize");
        value["engine"]
            .as_object_mut()
            .expect("engine should be an object")
            .remove("osdOpacityPct");

        let config: AppConfig = serde_json::from_value(value).expect("legacy config should load");

        assert_eq!(config.engine.osd_opacity_pct, 90);
    }

    #[test]
    fn osd_opacity_is_normalized_to_supported_steps() {
        let mut value =
            serde_json::to_value(default_app_config()).expect("config should serialize");
        value["engine"]["osdOpacityPct"] = serde_json::json!(51);

        let config: AppConfig = serde_json::from_value(value).expect("config should load");

        assert_eq!(config.engine.osd_opacity_pct, 50);
    }
}
