#Requires AutoHotkey v2.0
#SingleInstance Force

Persistent
CoordMode("Mouse", "Screen")

; ==============================================================================
; MouseGesture 5Btn - Core Gesture Engine (AutoHotkey v2)
; ==============================================================================

global STATE_IDLE := 0
global STATE_PENDING := 1
global STATE_DRAWING := 2

global gState := STATE_IDLE
global gTrigger := ""
global gStartX := 0
global gStartY := 0
global gLastX := 0
global gLastY := 0
global gTrailPrevX := 0
global gTrailPrevY := 0
global gStartWin := 0
global gStartProcess := ""
global gSteps := []
global gThreshold := 10
global gStepThreshold := 16
global gIsPaused := false
global gEdgeScrollEnabled := true
global gDebugLogEnabled := false
global gShowTrail := true
global gTrailColor := 0x0078D4 ; Windows 11 Fluent Blue (BGR: 0xD47800)
global gTrailWidth := 4
global gChordWheelTriggered := false
global gLogFile := A_ScriptDir . "\gesture.log"

; Dynamic Dispatch Hooks (Callable objects overridden by generated script)
global gFnIsProcessDisabled := (procName) => false
global gFnDispatchGestureAction := (trigger, stepStr, procName) => ""
global gFnGetGestureActionName := (trigger, stepStr, procName) => ""

; ------------------------------------------------------------------------------
; Logging Helper
; ------------------------------------------------------------------------------
LogGesture(msg) {
    global gDebugLogEnabled, gLogFile
    if (!gDebugLogEnabled)
        return
    try {
        timeStr := FormatTime(, "yyyy-MM-dd HH:mm:ss")
        FileAppend("[" . timeStr . "] " . msg . "`n", gLogFile, "UTF-8")
    }
}

; ------------------------------------------------------------------------------
; Helper: Mathematical ATan2 for Angle Calculation
; ------------------------------------------------------------------------------
ATan2(y, x) {
    if (x > 0)
        return DllCall("msvcrt\atan", "Double", y / x, "Cdecl Double")
    else if (x < 0 && y >= 0)
        return DllCall("msvcrt\atan", "Double", y / x, "Cdecl Double") + 3.141592653589793
    else if (x < 0 && y < 0)
        return DllCall("msvcrt\atan", "Double", y / x, "Cdecl Double") - 3.141592653589793
    else if (x == 0 && y > 0)
        return 1.5707963267948966
    else if (x == 0 && y < 0)
        return -1.5707963267948966
    return 0.0
}

; ------------------------------------------------------------------------------
; Helper: Convert Vector to 8 Directions (U, D, L, R, UL, UR, DL, DR)
; ------------------------------------------------------------------------------
GetDirection(dx, dy) {
    rad := ATan2(dy, dx)
    deg := Mod(rad * 57.29577951308232 + 360, 360)

    if (deg >= 337.5 || deg < 22.5)
        return "R"
    else if (deg >= 22.5 && deg < 67.5)
        return "DR"
    else if (deg >= 67.5 && deg < 112.5)
        return "D"
    else if (deg >= 112.5 && deg < 157.5)
        return "DL"
    else if (deg >= 157.5 && deg < 202.5)
        return "L"
    else if (deg >= 202.5 && deg < 247.5)
        return "UL"
    else if (deg >= 247.5 && deg < 292.5)
        return "U"
    else
        return "UR"
}

; ------------------------------------------------------------------------------
; Direction Arrow and Trigger Name Formatters
; ------------------------------------------------------------------------------
FormatStepArrow(step) {
    switch step {
        case "U": return "↑"
        case "D": return "↓"
        case "L": return "←"
        case "R": return "→"
        case "UL": return "↖"
        case "UR": return "↗"
        case "DL": return "↙"
        case "DR": return "↘"
        case "WU": return "W↑"
        case "WD": return "W↓"
        default: return step
    }
}

FormatTriggerName(trig) {
    switch trig {
        case "RButton", "RB", "R": return "R(右鍵)"
        case "MButton", "MB", "M": return "M(中鍵)"
        case "LButton", "LB", "L": return "L(左鍵)"
        case "XButton1", "X1", "X1B": return "X1(側鍵1)"
        case "XButton2", "X2", "X2B": return "X2(側鍵2)"
        case "EdgeTopL": return "螢幕頂部左側"
        case "EdgeTopR": return "螢幕頂部右側"
        case "EdgeLeft": return "螢幕左側邊緣"
        case "EdgeRight": return "螢幕右側邊緣"
        case "CornerTL": return "左上觸控角(TL)"
        case "CornerTR": return "右上觸控角(TR)"
        case "CornerBL": return "左下觸控角(BL)"
        case "CornerBR": return "右下觸控角(BR)"
        default: return trig
    }
}

; ------------------------------------------------------------------------------
; Visual Gesture Trail (Screen Overlay Direct Line Drawing)
; ------------------------------------------------------------------------------
DrawTrailSegment(x1, y1, x2, y2) {
    global gShowTrail, gTrailWidth
    if (!gShowTrail)
        return
    try {
        ; Draw directly on Screen DC for zero latency
        hDC := DllCall("GetDC", "Ptr", 0, "Ptr")
        ; Windows 11 Blue pen: 0xD47800 (RGB: 0, 120, 212)
        hPen := DllCall("CreatePen", "Int", 0, "Int", gTrailWidth, "UInt", 0xD47800, "Ptr")
        hOldPen := DllCall("SelectObject", "Ptr", hDC, "Ptr", hPen, "Ptr")
        DllCall("MoveToEx", "Ptr", hDC, "Int", x1, "Int", y1, "Ptr", 0)
        DllCall("LineTo", "Ptr", hDC, "Int", x2, "Int", y2)
        DllCall("SelectObject", "Ptr", hDC, "Ptr", hOldPen)
        DllCall("DeleteObject", "Ptr", hPen)
        DllCall("ReleaseDC", "Ptr", 0, "Ptr", hDC)
    }
}

ClearTrail() {
    try {
        ; Invalidate entire screen to erase drawn trail lines smoothly
        DllCall("RedrawWindow", "Ptr", 0, "Ptr", 0, "Ptr", 0, "UInt", 0x0085)
        ; RDW_INVALIDATE (0x1) | RDW_ERASE (0x4) | RDW_ALLCHILDREN (0x80)
    }
}

; ------------------------------------------------------------------------------
; Bottom-Center HUD OSD (Screen X Center, Y at 3/4)
; ------------------------------------------------------------------------------
global gHudGui := ""
global gHudTextMain := ""
global gHudTextSub := ""

InitHudGui() {
    global gHudGui, gHudTextMain, gHudTextSub
    if (gHudGui != "")
        return

    ; Use ToolWindow without caption, layered for smooth rendering
    gHudGui := Gui("-Caption +AlwaysOnTop +ToolWindow +Owner +E0x20", "MouseGestureHUD")
    gHudGui.BackColor := "1E1E1E"
    gHudGui.MarginX := 24
    gHudGui.MarginY := 16
    WinSetTransparent(230, gHudGui)

    ; Generous height & clean line-spacing to avoid text clipping
    gHudTextMain := gHudGui.Add("Text", "w520 h36 Center cFFFFFF", "")
    gHudTextMain.SetFont("s16 bold", "微軟正黑體")

    gHudTextSub := gHudGui.Add("Text", "w520 h28 Center c58A6FF", "")
    gHudTextSub.SetFont("s13", "微軟正黑體")
}

UpdateGestureOSD(trigger, steps, procName) {
    global gFnGetGestureActionName, gHudGui, gHudTextMain, gHudTextSub
    InitHudGui()

    trigName := FormatTriggerName(trigger)
    arrows := ""
    stepStr := ""
    for i, s in steps {
        arrows .= FormatStepArrow(s)
        stepStr .= (i == 1 ? "" : ",") . s
    }

    actionName := gFnGetGestureActionName(trigger, stepStr, procName)

    ; Update HUD Window Text
    mainStr := trigName . (arrows != "" ? " " . arrows : "")
    subStr := (actionName != "" ? "» " . actionName : (procName != "" ? "[" . procName . "]" : ""))

    gHudTextMain.Text := mainStr
    gHudTextSub.Text := subStr

    hudW := 568
    hudH := 96
    hudX := (A_ScreenWidth - hudW) // 2
    hudY := (A_ScreenHeight * 3) // 4 - (hudH // 2) ; Exactly at Y 3/4 of screen
    gHudGui.Show("x" . hudX . " y" . hudY . " w" . hudW . " h" . hudH . " NoActivate")
}

HideGestureOSD() {
    global gHudGui
    if (gHudGui != "") {
        gHudGui.Hide()
    }
    ClearTrail()
}

; ------------------------------------------------------------------------------
; Spatial Screen Context (Hot Corners & Edges)
; Corner tolerance: 4 pixels. Priority: Hot Corner > Edge Split
; ------------------------------------------------------------------------------
GetSpatialContext(x, y) {
    w := A_ScreenWidth
    h := A_ScreenHeight
    cTol := 4

    ; 1. Hot Corners (Highest Priority)
    if (x <= cTol && y <= cTol)
        return "CornerTL"
    if (x >= w - cTol && y <= cTol)
        return "CornerTR"
    if (x <= cTol && y >= h - cTol)
        return "CornerBL"
    if (x >= w - cTol && y >= h - cTol)
        return "CornerBR"

    ; 2. Screen Edges with Split
    if (y <= 1) {
        if (x < w / 2)
            return "EdgeTopL"
        else
            return "EdgeTopR"
    }
    if (y >= h - 2) {
        if (x < w / 2)
            return "EdgeBottomL"
        else
            return "EdgeBottomR"
    }
    if (x <= 1)
        return "EdgeLeft"
    if (x >= w - 2)
        return "EdgeRight"

    return ""
}

; ------------------------------------------------------------------------------
; Hot Corner Background Polling
; Triggers immediately when cursor enters a corner
; ------------------------------------------------------------------------------
global gLastCorner := ""
PollHotCorner() {
    global gIsPaused, gLastCorner, gFnDispatchGestureAction, gFnIsProcessDisabled

    if (gIsPaused)
        return

    MouseGetPos(&cx, &cy, &winHwnd)
    spatial := GetSpatialContext(cx, cy)

    if (SubStr(spatial, 1, 6) = "Corner") {
        if (gLastCorner != spatial) {
            gLastCorner := spatial
            procName := ""
            try {
                procName := WinGetProcessName(winHwnd)
            }
            if (!gFnIsProcessDisabled(procName)) {
                LogGesture("HotCorner Triggered: " . spatial . " Process: " . procName)
                UpdateGestureOSD(spatial, [], procName)
                SetTimer(HideGestureOSD, -800)
                gFnDispatchGestureAction(spatial, "", procName)
            }
        }
    } else {
        gLastCorner := ""
    }
}
SetTimer(PollHotCorner, 50)

; ------------------------------------------------------------------------------
; Trigger Handlers (RButton, XButton1, XButton2)
; ------------------------------------------------------------------------------
OnTriggerDown(btnName) {
    global gState, gTrigger, gStartX, gStartY, gLastX, gLastY, gTrailPrevX, gTrailPrevY
    global gStartWin, gStartProcess, gSteps, gIsPaused, gFnIsProcessDisabled
    global gChordWheelTriggered

    if (gIsPaused) {
        SendEvent("{" btnName " Down}")
        return
    }

    MouseGetPos(&curX, &curY, &winHwnd)
    procName := ""
    try {
        procName := WinGetProcessName(winHwnd)
    }

    ; Priority 3: Check blacklist (disabled apps)
    if (gFnIsProcessDisabled(procName)) {
        LogGesture("App disabled (blacklist): " . procName . " - Passing through " . btnName)
        SendEvent("{" btnName " Down}")
        return
    }

    gState := STATE_PENDING
    gTrigger := btnName
    gStartX := curX
    gStartY := curY
    gLastX := curX
    gLastY := curY
    gTrailPrevX := curX
    gTrailPrevY := curY
    gStartWin := winHwnd
    gStartProcess := procName
    gSteps := []
    gChordWheelTriggered := false

    SetTimer(TrackGesture, 10)
}

TrackGesture() {
    global gState, gTrigger, gStartX, gStartY, gLastX, gLastY, gTrailPrevX, gTrailPrevY, gSteps
    global gStartProcess, gThreshold, gStepThreshold

    if (gState == STATE_IDLE) {
        SetTimer(TrackGesture, 0)
        return
    }

    MouseGetPos(&curX, &curY)
    dxTotal := curX - gStartX
    dyTotal := curY - gStartY
    totalDist := Sqrt(dxTotal * dxTotal + dyTotal * dyTotal)

    if (gState == STATE_PENDING) {
        if (totalDist >= gThreshold) {
            gState := STATE_DRAWING
            dir := GetDirection(dxTotal, dyTotal)
            gSteps.Push(dir)
            DrawTrailSegment(gStartX, gStartY, curX, curY)
            gLastX := curX
            gLastY := curY
            gTrailPrevX := curX
            gTrailPrevY := curY
            UpdateGestureOSD(gTrigger, gSteps, gStartProcess)
        }
    } else if (gState == STATE_DRAWING) {
        ; Continuous visual trail line
        if (curX != gTrailPrevX || curY != gTrailPrevY) {
            DrawTrailSegment(gTrailPrevX, gTrailPrevY, curX, curY)
            gTrailPrevX := curX
            gTrailPrevY := curY
        }

        dxStep := curX - gLastX
        dyStep := curY - gLastY
        stepDist := Sqrt(dxStep * dxStep + dyStep * dyStep)

        if (stepDist >= gStepThreshold) {
            dir := GetDirection(dxStep, dyStep)
            if (gSteps.Length == 0 || gSteps[gSteps.Length] != dir) {
                gSteps.Push(dir)
                UpdateGestureOSD(gTrigger, gSteps, gStartProcess)
            }
            gLastX := curX
            gLastY := curY
        }
    }
}

OnTriggerUp(btnName) {
    global gState, gTrigger, gSteps, gStartProcess, gStartX, gStartY
    global gFnDispatchGestureAction, gChordWheelTriggered

    SetTimer(TrackGesture, 0)

    ; If chord wheel was executed while holding this button, suppress native button click
    if (gChordWheelTriggered) {
        gState := STATE_IDLE
        gChordWheelTriggered := false
        SetTimer(HideGestureOSD, -300)
        return
    }

    if (gState == STATE_PENDING) {
        ; Normal click passthrough
        gState := STATE_IDLE
        HideGestureOSD()
        SendEvent("{" btnName "}")
        return
    }

    if (gState == STATE_DRAWING) {
        gState := STATE_IDLE
        stepStr := ""
        for i, s in gSteps {
            stepStr .= (i == 1 ? "" : ",") . s
        }
        LogGesture("Gesture Release: Trigger=" . gTrigger . " Steps=" . stepStr . " Process=" . gStartProcess)
        UpdateGestureOSD(gTrigger, gSteps, gStartProcess)
        SetTimer(HideGestureOSD, -300)
        gFnDispatchGestureAction(gTrigger, stepStr, gStartProcess)
        return
    }

    gState := STATE_IDLE
    HideGestureOSD()
}

; ------------------------------------------------------------------------------
; Spatial Wheel Handler: Checks Top Edge Split (L/R) and Hot Corners
; ------------------------------------------------------------------------------
HandleSpatialWheel(wheelDir) {
    global gIsPaused, gEdgeScrollEnabled, gFnDispatchGestureAction, gFnIsProcessDisabled

    if (gIsPaused || !gEdgeScrollEnabled)
        return false

    MouseGetPos(&cx, &cy, &winHwnd)
    spatial := GetSpatialContext(cx, cy)
    if (spatial == "")
        return false

    procName := ""
    try {
        procName := WinGetProcessName(winHwnd)
    }

    if (gFnIsProcessDisabled(procName))
        return false

    LogGesture("Spatial Wheel: " . spatial . " Wheel=" . wheelDir . " Process=" . procName)
    UpdateGestureOSD(spatial, [wheelDir], procName)
    SetTimer(HideGestureOSD, -400)

    ; Try dispatching to spatial binding (e.g. EdgeTopR + WU)
    dispatched := gFnDispatchGestureAction(spatial, wheelDir, procName)
    if (dispatched)
        return true

    ; Built-in fallback: EdgeTopR/EdgeTopL volume control if no custom binding matched
    if (spatial == "EdgeTopR" || spatial == "EdgeTopL" || spatial == "EdgeTop") {
        if (wheelDir == "WU")
            SoundSetVolume("+2")
        else if (wheelDir == "WD")
            SoundSetVolume("-2")
        return true
    }

    return false
}

; ------------------------------------------------------------------------------
; Chord Wheel Handler (e.g. Hold RButton or XButton and Scroll Wheel)
; ------------------------------------------------------------------------------
HandleChordWheel(wheelDir) {
    global gState, gTrigger, gStartProcess, gChordWheelTriggered, gFnDispatchGestureAction

    if (gState != STATE_PENDING && gState != STATE_DRAWING)
        return false

    gChordWheelTriggered := true
    LogGesture("Chord Wheel: Trigger=" . gTrigger . " Wheel=" . wheelDir . " Process=" . gStartProcess)
    UpdateGestureOSD(gTrigger, [wheelDir], gStartProcess)
    SetTimer(HideGestureOSD, -400)

    gFnDispatchGestureAction(gTrigger, wheelDir, gStartProcess)
    return true
}

; ------------------------------------------------------------------------------
; Hotkey Hooks for RButton, XButton1, XButton2
; ------------------------------------------------------------------------------
*RButton::OnTriggerDown("RButton")
*RButton Up::OnTriggerUp("RButton")

*XButton1::OnTriggerDown("XButton1")
*XButton1 Up::OnTriggerUp("XButton1")

*XButton2::OnTriggerDown("XButton2")
*XButton2 Up::OnTriggerUp("XButton2")

; ------------------------------------------------------------------------------
; Wheel Interception: Chord Wheel > Spatial Edge/Corner > Native Wheel
; ------------------------------------------------------------------------------
#HotIf (gState != STATE_IDLE)
*WheelUp::HandleChordWheel("WU")
*WheelDown::HandleChordWheel("WD")
#HotIf

#HotIf (GetSpatialContext((MouseGetPos(&_x, &_y), _x), _y) != "")
*WheelUp::HandleSpatialWheel("WU")
*WheelDown::HandleSpatialWheel("WD")
#HotIf
