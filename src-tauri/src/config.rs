use serde::{Deserialize, Serialize};

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
        },
        edge_scroll: EdgeScrollConfig {
            enabled: true,
            top_edge: true,
            action: "volume".into(),
        },
        gesture_templates: vec![
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
                executables: vec![
                    "mouse-gesture-5btn.exe".into(),
                    "photoshop.exe".into(),
                ],
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
                            id: "r-down-right".into(),
                            name: "Down-Right".into(),
                            trigger: "R".into(),
                            steps: vec!["D".into(), "R".into()],
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
                            id: "r-up-left".into(),
                            name: "Up-Left".into(),
                            trigger: "R".into(),
                            steps: vec!["U".into(), "L".into()],
                        },
                        action: Action {
                            id: "act-reopen-tab".into(),
                            name: "Reopen Closed Tab".into(),
                            action_type: "keys".into(),
                            value: "^+t".into(),
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
                    Binding {
                        id: "g-lalt-to-lwin".into(),
                        enabled: false,
                        gesture: Gesture {
                            id: "key-lalt".into(),
                            name: "Left Alt".into(),
                            trigger: "LAlt".into(),
                            steps: vec![],
                        },
                        action: Action {
                            id: "act-lwin".into(),
                            name: "Trigger Win".into(),
                            action_type: "remap".into(),
                            value: "LWin".into(),
                        },
                    },
                    Binding {
                        id: "g-lwin-to-lalt".into(),
                        enabled: false,
                        gesture: Gesture {
                            id: "key-lwin".into(),
                            name: "Left Win".into(),
                            trigger: "LWin".into(),
                            steps: vec![],
                        },
                        action: Action {
                            id: "act-lalt".into(),
                            name: "Trigger Alt".into(),
                            action_type: "remap".into(),
                            value: "LAlt".into(),
                        },
                    },
                ],
            },
        ],
    }
}
