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
pub struct ActionTemplate {
    pub id: String,
    pub name: String,
    pub action_type: String,
    pub value: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Target {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub kind: String, // "disabled" | "group" | "global"
    pub executables: Vec<String>,
    pub bindings: Vec<Binding>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Binding {
    pub id: String,
    pub enabled: bool,
    pub gesture: Gesture,
    pub action: Action,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Gesture {
    pub id: String,
    pub name: String,
    pub trigger: String,
    pub steps: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Action {
    pub id: String,
    pub name: String,
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
                name: "向左".into(),
                trigger: "RB".into(),
                steps: vec!["L".into()],
            },
            GestureTemplate {
                id: "rb-right".into(),
                name: "向右".into(),
                trigger: "RB".into(),
                steps: vec!["R".into()],
            },
            GestureTemplate {
                id: "rb-down".into(),
                name: "向下".into(),
                trigger: "RB".into(),
                steps: vec!["D".into()],
            },
            GestureTemplate {
                id: "rb-down-right".into(),
                name: "向右下".into(),
                trigger: "RB".into(),
                steps: vec!["D".into(), "R".into()],
            },
            GestureTemplate {
                id: "rb-up-left".into(),
                name: "向左上".into(),
                trigger: "RB".into(),
                steps: vec!["U".into(), "L".into()],
            },
        ],
        action_templates: vec![
            ActionTemplate {
                id: "act-back".into(),
                name: "上一頁".into(),
                action_type: "keys".into(),
                value: "!{Left}".into(),
            },
            ActionTemplate {
                id: "act-forward".into(),
                name: "下一頁".into(),
                action_type: "keys".into(),
                value: "!{Right}".into(),
            },
            ActionTemplate {
                id: "act-close-tab".into(),
                name: "關閉分頁".into(),
                action_type: "keys".into(),
                value: "^w".into(),
            },
            ActionTemplate {
                id: "act-reopen-tab".into(),
                name: "回復關閉分頁".into(),
                action_type: "keys".into(),
                value: "^+t".into(),
            },
            ActionTemplate {
                id: "act-minimize".into(),
                name: "最小化視窗".into(),
                action_type: "ahk".into(),
                value: "WinMinimize('A')".into(),
            },
        ],
        targets: vec![
            Target {
                id: "disabled".into(),
                name: "黑名單 (不套用程式)".into(),
                enabled: true,
                kind: "disabled".into(),
                executables: vec!["photoshop.exe".into(), "games.exe".into()],
                bindings: vec![],
            },
            Target {
                id: "browsers".into(),
                name: "瀏覽器群組".into(),
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
                            name: "右鍵向右下".into(),
                            trigger: "RB".into(),
                            steps: vec!["D".into(), "R".into()],
                        },
                        action: Action {
                            id: "act-close-tab".into(),
                            name: "關閉分頁".into(),
                            action_type: "keys".into(),
                            value: "^w".into(),
                        },
                    },
                    Binding {
                        id: "b-reopen-tab".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "rb-up-left".into(),
                            name: "右鍵向左上".into(),
                            trigger: "RB".into(),
                            steps: vec!["U".into(), "L".into()],
                        },
                        action: Action {
                            id: "act-reopen-tab".into(),
                            name: "回復已關閉分頁".into(),
                            action_type: "keys".into(),
                            value: "^+t".into(),
                        },
                    },
                ],
            },
            Target {
                id: "global".into(),
                name: "全域 (Global)".into(),
                enabled: true,
                kind: "global".into(),
                executables: vec![],
                bindings: vec![
                    Binding {
                        id: "g-back".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "rb-left".into(),
                            name: "右鍵向左".into(),
                            trigger: "RB".into(),
                            steps: vec!["L".into()],
                        },
                        action: Action {
                            id: "act-back".into(),
                            name: "上一頁 (Alt+Left)".into(),
                            action_type: "keys".into(),
                            value: "!{Left}".into(),
                        },
                    },
                    Binding {
                        id: "g-forward".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "r-right".into(),
                            name: "向右測試".into(),
                            trigger: "R".into(),
                            steps: vec!["R".into()],
                        },
                        action: Action {
                            id: "act-hello".into(),
                            name: "彈出 Hello World (測試)".into(),
                            action_type: "ahk".into(),
                            value: "MsgBox(\"Hello World!\", \"MouseGesture 5Btn\")".into(),
                        },
                    },
                    Binding {
                        id: "g-minimize".into(),
                        enabled: true,
                        gesture: Gesture {
                            id: "rb-down".into(),
                            name: "右鍵向下".into(),
                            trigger: "RB".into(),
                            steps: vec!["D".into()],
                        },
                        action: Action {
                            id: "act-minimize".into(),
                            name: "最小化視窗".into(),
                            action_type: "ahk".into(),
                            value: "WinMinimize('A')".into(),
                        },
                    },
                ],
            },
        ],
    }
}
