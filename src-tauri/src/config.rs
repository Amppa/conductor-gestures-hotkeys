use serde::{Deserialize, Deserializer, Serialize};

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
    pub name: String,
    pub trigger: String,
    pub steps: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionTemplate {
    pub id: String,
    pub name: String,
    #[serde(alias = "type", rename = "type")]
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
    pub name: String,
    pub trigger: String,
    pub steps: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Action {
    pub id: String,
    pub name: String,
    #[serde(alias = "type", rename = "type")]
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

pub fn default_app_config() -> AppConfig {
    AppConfig {
        version: 1,
        language: "zh-TW".into(),
        engine: EngineConfig {
            enabled: true,
            debug: false,
            threshold_px: 10,
            osd_duration_ms: default_osd_duration_ms(),
            osd_font_size_px: default_osd_font_size_px(),
            osd_opacity_pct: default_osd_opacity_pct(),
        },
        edge_scroll: EdgeScrollConfig {
            enabled: true,
            top_edge: true,
            action: "volume".into(),
        },
        gesture_templates: vec![
            GestureTemplate { id: "r-diagonal-ul".into(), name: "Right Button Up-Left".into(), trigger: "R".into(), steps: vec!["UL".into()] },
            GestureTemplate { id: "r-diagonal-ur".into(), name: "Right Button Up-Right".into(), trigger: "R".into(), steps: vec!["UR".into()] },
            GestureTemplate { id: "r-diagonal-dr".into(), name: "Right Button Down-Right".into(), trigger: "R".into(), steps: vec!["DR".into()] },
            GestureTemplate { id: "r-diagonal-dl".into(), name: "Right Button Down-Left".into(), trigger: "R".into(), steps: vec!["DL".into()] },
            GestureTemplate {
                id: "r-left".into(),
                name: "Left".into(),
                trigger: "R".into(),
                steps: vec!["L".into()],
            },
            GestureTemplate {
                id: "r-right".into(),
                name: "Right".into(),
                trigger: "R".into(),
                steps: vec!["R".into()],
            },
            GestureTemplate {
                id: "r-up".into(),
                name: "Up".into(),
                trigger: "R".into(),
                steps: vec!["U".into()],
            },
            GestureTemplate {
                id: "r-down".into(),
                name: "Down".into(),
                trigger: "R".into(),
                steps: vec!["D".into()],
            },
            GestureTemplate {
                id: "r-down-right".into(),
                name: "Down-Right".into(),
                trigger: "R".into(),
                steps: vec!["D".into(), "R".into()],
            },
            GestureTemplate {
                id: "r-up-left".into(),
                name: "Up-Left".into(),
                trigger: "R".into(),
                steps: vec!["U".into(), "L".into()],
            },
            GestureTemplate {
                id: "x1-click".into(),
                name: "X1 Click".into(),
                trigger: "X1".into(),
                steps: vec![],
            },
            GestureTemplate {
                id: "x2-click".into(),
                name: "X2 Click".into(),
                trigger: "X2".into(),
                steps: vec![],
            },
            GestureTemplate {
                id: "r-wu".into(),
                name: "R + Wheel Up".into(),
                trigger: "R".into(),
                steps: vec!["WU".into()],
            },
            GestureTemplate {
                id: "r-wd".into(),
                name: "R + Wheel Down".into(),
                trigger: "R".into(),
                steps: vec!["WD".into()],
            },
            GestureTemplate {
                id: "corner-br".into(),
                name: "Bottom-Right Corner".into(),
                trigger: "CornerBR".into(),
                steps: vec![],
            },
            GestureTemplate {
                id: "key-insert".into(),
                name: "Insert Key".into(),
                trigger: "Insert".into(),
                steps: vec![],
            },
            GestureTemplate {
                id: "key-lalt".into(),
                name: "Left Alt".into(),
                trigger: "LAlt".into(),
                steps: vec![],
            },
            GestureTemplate {
                id: "key-lwin".into(),
                name: "Left Win".into(),
                trigger: "LWin".into(),
                steps: vec![],
            },
        ],
        action_templates: vec![
            ActionTemplate {
                id: "act-back".into(),
                name: "Back".into(),
                action_type: "keys".into(),
                value: "!{Left}".into(),
            },
            ActionTemplate {
                id: "act-forward".into(),
                name: "Forward".into(),
                action_type: "keys".into(),
                value: "!{Right}".into(),
            },
            ActionTemplate {
                id: "act-close-tab".into(),
                name: "Close Tab".into(),
                action_type: "keys".into(),
                value: "^w".into(),
            },
            ActionTemplate {
                id: "act-reopen-tab".into(),
                name: "Reopen Closed Tab".into(),
                action_type: "keys".into(),
                value: "^+t".into(),
            },
            ActionTemplate {
                id: "act-minimize".into(),
                name: "Minimize Window".into(),
                action_type: "ahk".into(),
                value: "WinMinimize('A')".into(),
            },
            ActionTemplate {
                id: "act-show-desktop".into(),
                name: "Show Desktop".into(),
                action_type: "keys".into(),
                value: "#d".into(),
            },
            ActionTemplate {
                id: "act-vol-up".into(),
                name: "Volume Up".into(),
                action_type: "keys".into(),
                value: "{Volume_Up}".into(),
            },
            ActionTemplate {
                id: "act-vol-down".into(),
                name: "Volume Down".into(),
                action_type: "keys".into(),
                value: "{Volume_Down}".into(),
            },
            ActionTemplate {
                id: "act-prev-tab".into(),
                name: "Previous Tab".into(),
                action_type: "keys".into(),
                value: "^{PgUp}".into(),
            },
            ActionTemplate {
                id: "act-next-tab".into(),
                name: "Next Tab".into(),
                action_type: "keys".into(),
                value: "^{PgDn}".into(),
            },
            ActionTemplate {
                id: "act-noop".into(),
                name: "No-op (Mute)".into(),
                action_type: "noop".into(),
                value: "".into(),
            },
            ActionTemplate {
                id: "act-lwin".into(),
                name: "Trigger Win".into(),
                action_type: "remap".into(),
                value: "LWin".into(),
            },
            ActionTemplate {
                id: "act-lalt".into(),
                name: "Trigger Alt".into(),
                action_type: "remap".into(),
                value: "LAlt".into(),
            },
        ],
        key_remaps: vec![
            KeyRemap {
                id: "remap-disable-insert".into(),
                name: "停用 Insert 鍵 (靜音)".into(),
                enabled: false,
                src_key: "Insert".into(),
                dst_key: "none".into(),
            },
            KeyRemap {
                id: "remap-lalt-lwin".into(),
                name: "左 Alt 映射為 Win".into(),
                enabled: false,
                src_key: "LAlt".into(),
                dst_key: "LWin".into(),
            },
            KeyRemap {
                id: "remap-lwin-lalt".into(),
                name: "左 Win 映射為 Alt".into(),
                enabled: false,
                src_key: "LWin".into(),
                dst_key: "LAlt".into(),
            },
        ],
        targets: vec![
            Target {
                id: "disabled".into(),
                name: "Disabled List (Bypass)".into(),
                enabled: true,
                kind: "disabled".into(),
                executables: vec!["conductor.exe".into(), "photoshop.exe".into()],
                bindings: vec![],
            },
            Target {
                id: "group01".into(),
                name: "Group 01".into(),
                enabled: true,
                kind: "group".into(),
                executables: vec![
                    "chrome.exe".into(),
                    "msedge.exe".into(),
                    "firefox.exe".into(),
                    "brave.exe".into(),
                ],
                bindings: vec![
                    Binding {
                        id: "b-close-tab".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "r-right-down".into(),
                            name: "Right-Down".into(),
                            trigger: "R".into(),
                            steps: vec!["R".into(), "D".into()],
                        },
                        action: Action {
                            id: "act-close-tab".into(),
                            name: "Close Tab".into(),
                            action_type: "keys".into(),
                            value: "^w".into(),
                        },
                    },
                    Binding {
                        id: "b-reopen-tab".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "r-right-up".into(),
                            name: "Right-Up".into(),
                            trigger: "R".into(),
                            steps: vec!["R".into(), "U".into()],
                        },
                        action: Action {
                            id: "act-reopen-tab".into(),
                            name: "Reopen Closed Tab".into(),
                            action_type: "keys".into(),
                            value: "^+t".into(),
                        },
                    },
                    Binding {
                        id: "g-edge-top-prev-tab".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "edge-top-wu".into(),
                            name: "Top Edge Wheel Up".into(),
                            trigger: "EdgeTop".into(),
                            steps: vec!["WU".into()],
                        },
                        action: Action {
                            id: "act-prev-tab".into(),
                            name: "Previous Tab".into(),
                            action_type: "keys".into(),
                            value: "^{PgUp}".into(),
                        },
                    },
                    Binding {
                        id: "g-edge-top-next-tab".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "edge-top-wd".into(),
                            name: "Top Edge Wheel Down".into(),
                            trigger: "EdgeTop".into(),
                            steps: vec!["WD".into()],
                        },
                        action: Action {
                            id: "act-next-tab".into(),
                            name: "Next Tab".into(),
                            action_type: "keys".into(),
                            value: "^{PgDn}".into(),
                        },
                    },
                ],
            },
            Target {
                id: "global".into(),
                name: "Global Default".into(),
                enabled: true,
                kind: "global".into(),
                executables: vec![],
                bindings: vec![
                    Binding {
                        id: "g-back".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "r-left".into(),
                            name: "Left".into(),
                            trigger: "R".into(),
                            steps: vec!["L".into()],
                        },
                        action: Action {
                            id: "act-back".into(),
                            name: "Back".into(),
                            action_type: "keys".into(),
                            value: "!{Left}".into(),
                        },
                    },
                    Binding {
                        id: "g-forward".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "r-right".into(),
                            name: "Right".into(),
                            trigger: "R".into(),
                            steps: vec!["R".into()],
                        },
                        action: Action {
                            id: "act-forward".into(),
                            name: "Forward".into(),
                            action_type: "keys".into(),
                            value: "!{Right}".into(),
                        },
                    },
                    Binding {
                        id: "g-edge-left-vol-up".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "edge-left-wu".into(),
                            name: "Left Edge Wheel Up".into(),
                            trigger: "EdgeLeft".into(),
                            steps: vec!["WU".into()],
                        },
                        action: Action {
                            id: "act-vol-up".into(),
                            name: "Volume Up".into(),
                            action_type: "keys".into(),
                            value: "{Volume_Up}".into(),
                        },
                    },
                    Binding {
                        id: "g-edge-left-vol-down".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "edge-left-wd".into(),
                            name: "Left Edge Wheel Down".into(),
                            trigger: "EdgeLeft".into(),
                            steps: vec!["WD".into()],
                        },
                        action: Action {
                            id: "act-vol-down".into(),
                            name: "Volume Down".into(),
                            action_type: "keys".into(),
                            value: "{Volume_Down}".into(),
                        },
                    },
                    Binding {
                        id: "g-corner-br".into(),
                        enabled: false,
                        gesture: Gesture {
                            id: "corner-br".into(),
                            name: "Bottom-Right Corner".into(),
                            trigger: "CornerBR".into(),
                            steps: vec![],
                        },
                        action: Action {
                            id: "act-show-desktop".into(),
                            name: "Show Desktop".into(),
                            action_type: "keys".into(),
                            value: "#d".into(),
                        },
                    },
                    Binding {
                        id: "g-insert-mute".into(),
                        enabled: false,
                        gesture: Gesture {
                            id: "key-insert".into(),
                            name: "Insert".into(),
                            trigger: "Insert".into(),
                            steps: vec![],
                        },
                        action: Action {
                            id: "act-noop".into(),
                            name: "No-op (Mute)".into(),
                            action_type: "noop".into(),
                            value: "".into(),
                        },
                    },
                ],
            },
        ],
    }
}

#[cfg(test)]
mod tests {
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
                "r-diagonal-ul",
                "r-diagonal-ur",
                "r-diagonal-dr",
                "r-diagonal-dl",
                "r-left",
                "r-right",
                "r-up",
                "r-down",
                "r-down-right",
                "r-up-left",
                "x1-click",
                "x2-click",
                "r-wu",
                "r-wd",
                "corner-br",
                "key-insert",
                "key-lalt",
                "key-lwin",
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
