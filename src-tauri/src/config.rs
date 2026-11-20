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
    pub targets: Vec<Target>,
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
                id: "rb-left".into(),
                name: "Left".into(),
                trigger: "RB".into(),
                steps: vec!["L".into()],
            },
            GestureTemplate {
                id: "rb-right".into(),
                name: "Right".into(),
                trigger: "RB".into(),
                steps: vec!["R".into()],
            },
            GestureTemplate {
                id: "rb-down".into(),
                name: "Down".into(),
                trigger: "RB".into(),
                steps: vec!["D".into()],
            },
            GestureTemplate {
                id: "rb-down-right".into(),
                name: "Down-Right".into(),
                trigger: "RB".into(),
                steps: vec!["D".into(), "R".into()],
            },
            GestureTemplate {
                id: "rb-up-left".into(),
                name: "Up-Left".into(),
                trigger: "RB".into(),
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
        ],
        targets: vec![
            Target {
                id: "disabled".into(),
                name: "Disabled List (Bypass)".into(),
                enabled: true,
                kind: "disabled".into(),
                executables: vec!["photoshop.exe".into(), "games.exe".into()],
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
                            id: "rb-down-right".into(),
                            name: "Down-Right".into(),
                            trigger: "RB".into(),
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
                            id: "rb-up-left".into(),
                            name: "Up-Left".into(),
                            trigger: "RB".into(),
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
                            id: "rb-left".into(),
                            name: "Left".into(),
                            trigger: "RB".into(),
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
                        id: "g-minimize".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "rb-down".into(),
                            name: "Down".into(),
                            trigger: "RB".into(),
                            steps: vec!["D".into()],
                        },
                        action: Action {
                            id: "act-minimize".into(),
                            name: "Minimize Window".into(),
                            action_type: "ahk".into(),
                            value: "WinMinimize('A')".into(),
                        },
                    },
                ],
            },
        ],
    }
}
