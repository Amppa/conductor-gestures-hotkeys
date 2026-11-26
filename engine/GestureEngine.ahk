#Requires AutoHotkey v2.0
#SingleInstance Force

Persistent
CoordMode("Mouse", "Screen")

; ==============================================================================
; Conductor - Core Gesture Engine (AutoHotkey v2)
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
global gTrailWidth := 4
global gOsdDurationMs := 1000
global gOsdFontSizePx := 20
global gOsdOpacityPct := 90
global gOsdUnknownGestureLabel := "未知手勢"
global gWheelLabel := "滾輪"
global gChordWheelTriggered := false
global gLogFile := A_ScriptDir . "\gesture.log"
global gPauseFlagFile := A_ScriptDir . "\paused.flag"
global gMouseTriggers := ["RButton", "XButton1", "XButton2"]
global gCapturedButtons := Map()
global gNativeLeftDown := false
global gPendingLeftX := 0
global gPendingLeftY := 0
; Placeholders; the generated script replaces these with its own maps.
global gGeneratedRemapState := Map()
global gGeneratedRemapDestinationCounts := Map()

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
; Pause State (flag file written by the Tauri host)
; ------------------------------------------------------------------------------
UpdatePauseState() {
    global gIsPaused, gPauseFlagFile
    pausedNow := FileExist(gPauseFlagFile) ? true : false
    if (pausedNow = gIsPaused)
        return
    gIsPaused := pausedNow
    Suspend(gIsPaused)
    if (gIsPaused)
        ResetGestureState()
}

ResetGestureState() {
    global gState, gSteps, gChordWheelTriggered
    gState := STATE_IDLE
    gSteps := []
    gChordWheelTriggered := false
    SetTimer(TrackGesture, 0)
    HideGestureOSD()
    ReleaseGeneratedKeys()
    global gCapturedButtons, gNativeLeftDown
    SetTimer(TrackLeftPassthrough, 0)
    if gNativeLeftDown
        SendEvent("{LButton Up}")
    gNativeLeftDown := false
    gCapturedButtons.Clear()
}

SetMouseTriggers(triggers) {
    global gMouseTriggers
    gMouseTriggers := triggers
}

MouseTriggerForHeld(held) {
    global gMouseTriggers
    best := ""
    bestCount := 0
    for trigger in gMouseTriggers {
        buttons := StrSplit(trigger, "+")
        matches := true
        for button in buttons {
            if !held.Has(button) {
                matches := false
                break
            }
        }
        if (matches && buttons.Length > bestCount) {
            best := trigger
            bestCount := buttons.Length
        }
    }
    return best
}

HeldMouseButtons() {
    held := Map()
    for button in ["LButton", "MButton", "RButton", "XButton1", "XButton2"] {
        if GetKeyState(button, "P")
            held[button] := true
    }
    return held
}

ShouldCaptureMouse(button) {
    global gMouseTriggers, gIsPaused, gFnIsProcessDisabled, gCapturedButtons
    if gIsPaused
        return false
    if gCapturedButtons.Has(button)
        return true
    MouseGetPos(, , &hwnd)
    try {
        if gFnIsProcessDisabled(WinGetProcessName(hwnd))
            return false
    }
    held := HeldMouseButtons()
    held[button] := true
    trigger := MouseTriggerForHeld(held)
    for candidate in gMouseTriggers {
        if InStr("+" candidate "+", "+" button "+")
            return true
    }
    return false
}

OnMouseDown(button) {
    global gCapturedButtons, gState, gTrigger, gNativeLeftDown, gPendingLeftX, gPendingLeftY
    for captured, consumed in gCapturedButtons {
        if consumed {
            gCapturedButtons[button] := true
            return
        }
    }
    gCapturedButtons[button] := false
    held := HeldMouseButtons()
    held[button] := true
    trigger := MouseTriggerForHeld(held)
    if (button == "LButton" && trigger == "") {
        MouseGetPos(&gPendingLeftX, &gPendingLeftY)
        SetTimer(TrackLeftPassthrough, 10)
    }
    if (trigger == "" || (gState != STATE_IDLE && trigger == gTrigger))
        return
    ; End a native left-button hold when it becomes part of a gesture chord.
    SetTimer(TrackLeftPassthrough, 0)
    if (InStr(trigger, "LButton") && gNativeLeftDown) {
        SendEvent("{LButton Up}")
        gNativeLeftDown := false
    }
    OnTriggerDown(trigger)
}

; Delay a left-only press until movement or release so stationary L-first chords
; do not send a native click. Ordinary left dragging still starts at its origin.
TrackLeftPassthrough() {
    global gCapturedButtons, gNativeLeftDown, gPendingLeftX, gPendingLeftY, gState
    if (!gCapturedButtons.Has("LButton") || gState != STATE_IDLE || gNativeLeftDown) {
        SetTimer(TrackLeftPassthrough, 0)
        return
    }
    MouseGetPos(&x, &y)
    if (Abs(x - gPendingLeftX) + Abs(y - gPendingLeftY) < 2)
        return
    MouseMove(gPendingLeftX, gPendingLeftY, 0)
    SendEvent("{LButton Down}")
    MouseMove(x, y, 0)
    gNativeLeftDown := true
    SetTimer(TrackLeftPassthrough, 0)
}

OnMouseUp(button) {
    global gCapturedButtons, gState, gTrigger, gNativeLeftDown
    if !gCapturedButtons.Has(button)
        return
    used := gCapturedButtons[button]
    gCapturedButtons.Delete(button)
    if (button == "LButton") {
        SetTimer(TrackLeftPassthrough, 0)
        if gNativeLeftDown {
            SendEvent("{LButton Up}")
            gNativeLeftDown := false
            return
        }
    }
    if (gState != STATE_IDLE && InStr("+" gTrigger "+", "+" button "+")) {
        for captured, _ in gCapturedButtons
            gCapturedButtons[captured] := true
        OnTriggerUp(button)
    } else if !used {
        SendEvent("{" button "}")
    }
}

; Release any synthetic keys held by generated remap hotkeys so pausing never
; leaves a key stuck down.
ReleaseGeneratedKeys() {
    global gGeneratedRemapState, gGeneratedRemapDestinationCounts
    if !IsObject(gGeneratedRemapState)
        return
    previousLevel := SendLevel(0)
    try {
        SetKeyDelay(-1)
        for source, destination in gGeneratedRemapState.Clone()
            Send("{Blind}{" destination " Up}")
        gGeneratedRemapState.Clear()
        if IsObject(gGeneratedRemapDestinationCounts)
            gGeneratedRemapDestinationCounts.Clear()
    } finally {
        SendLevel(previousLevel)
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
    global gWheelLabel
    switch step {
        case "U": return "🡡"
        case "D": return "🡣"
        case "L": return "🡠"
        case "R": return "🡢"
        case "UL": return "🡤"
        case "UR": return "🡥"
        case "DL": return "🡧"
        case "DR": return "🡦"
        case "WU": return gWheelLabel . "↑"
        case "WD": return gWheelLabel . "↓"
        default: return step
    }
}

FormatTriggerName(trig) {
    switch trig {
        case "RButton", "R": return "R(右鍵)"
        case "MButton", "M": return "M(中鍵)"
        case "LButton", "L": return "L(左鍵)"
        case "XButton1", "X1": return "X1(側鍵1)"
        case "XButton2", "X2": return "X2(側鍵2)"
        case "EdgeTop": return "螢幕頂部邊緣"
        case "EdgeBottom": return "螢幕底部邊緣"
        case "EdgeLeft": return "螢幕左側邊緣"
        case "EdgeRight": return "螢幕右側邊緣"
        case "EdgeTopLeftHalf": return "⬒ 上側左半"
        case "EdgeTopRightHalf": return "⬒ 上側右半"
        case "EdgeBottomLeftHalf": return "⬓ 下側左半"
        case "EdgeBottomRightHalf": return "⬓ 下側右半"
        case "EdgeLeftTopHalf": return "◧ 左側上半"
        case "EdgeLeftBottomHalf": return "◧ 左側下半"
        case "EdgeRightTopHalf": return "◨ 右側上半"
        case "EdgeRightBottomHalf": return "◨ 右側下半"
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

AddHudTextControl() {
    global gHudGui, gOsdFontSizePx
    control := gHudGui.Add("Text", "x0 y0 w1 h1 Center cFFFFFF BackgroundTrans +0x200 +0x4000", "")
    fontSizePt := Round(gOsdFontSizePx * 0.75, 2)
    control.SetFont("s" . fontSizePt . " bold", "微軟正黑體")
    return control
}

InitHudGui() {
    global gHudGui, gHudTextMain, gHudTextSub, gOsdOpacityPct
    if (gHudGui != "")
        return

    windowOpts := "-Caption +AlwaysOnTop +ToolWindow +Owner +E0x20 -DPIScale"
    gHudGui := Gui(windowOpts, "ConductorHUD")
    gHudGui.BackColor := "1E1E1E"
    gHudGui.MarginX := 0
    gHudGui.MarginY := 0
    opacityAlpha := Round(255 * gOsdOpacityPct / 100)
    WinSetTransparent(opacityAlpha, gHudGui)

    gHudTextMain := AddHudTextControl()
    gHudTextSub := AddHudTextControl()
}

MeasureHudText(control, text) {
    global gOsdFontSizePx
    hDC := DllCall("GetDC", "Ptr", control.Hwnd, "Ptr")
    if (!hDC)
        return { w: StrLen(text) * gOsdFontSizePx, h: gOsdFontSizePx }

    hFont := DllCall("SendMessage", "Ptr", control.Hwnd, "UInt", 0x31, "Ptr", 0, "Ptr", 0, "Ptr")
    hOldFont := hFont ? DllCall("SelectObject", "Ptr", hDC, "Ptr", hFont, "Ptr") : 0
    size := Buffer(8, 0)
    measured := false
    try {
        measured := DllCall("GetTextExtentPoint32W", "Ptr", hDC, "Str", text, "Int", StrLen(text), "Ptr", size.Ptr)
    } finally {
        if (hOldFont)
            DllCall("SelectObject", "Ptr", hDC, "Ptr", hOldFont, "Ptr")
        DllCall("ReleaseDC", "Ptr", control.Hwnd, "Ptr", hDC)
    }

    if (!measured)
        return { w: StrLen(text) * gOsdFontSizePx, h: gOsdFontSizePx }
    return { w: NumGet(size, 0, "Int"), h: NumGet(size, 4, "Int") }
}

; ------------------------------------------------------------------------------
; Multi-Monitor Resolution & Geometry Helper (Win32 MonitorFromPoint API)
; ------------------------------------------------------------------------------
GetMonitorRectAt(x, y, &mL, &mT, &mR, &mB, &mW, &mH) {
    static sizeofMONITORINFO := 40
    static rcMonitor := 4

    pt := (y << 32) | (x & 0xFFFFFFFF)
    ; MONITOR_DEFAULTTONEAREST = 2
    hMon := DllCall("MonitorFromPoint", "Int64", pt, "UInt", 2, "Ptr")
    minf := Buffer(sizeofMONITORINFO, 0)
    NumPut("UInt", sizeofMONITORINFO, minf)

    if (DllCall("GetMonitorInfo", "Ptr", hMon, "Ptr", minf.Ptr)) {
        mL := NumGet(minf, rcMonitor + 0, "Int")
        mT := NumGet(minf, rcMonitor + 4, "Int")
        mR := NumGet(minf, rcMonitor + 8, "Int")
        mB := NumGet(minf, rcMonitor + 12, "Int")
        mW := mR - mL
        mH := mB - mT
    } else {
        ; Fallback to virtual primary screen
        mL := 0
        mT := 0
        mW := A_ScreenWidth
        mH := A_ScreenHeight
        mR := mW
        mB := mH
    }
}

UpdateGestureOSD(trigger, steps, procName) {
    global gFnGetGestureActionName, gHudGui, gHudTextMain, gHudTextSub
    global gOsdDurationMs, gOsdFontSizePx, gOsdUnknownGestureLabel
    if (gOsdDurationMs <= 0)
        return

    InitHudGui()
    SetTimer(HideGestureOSD, 0)

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
    subStr := (actionName != "" ? actionName : gOsdUnknownGestureLabel)

    gHudTextMain.Text := mainStr
    gHudTextSub.Text := subStr

    ; Multi-Monitor HUD Positioning: find current monitor under cursor
    MouseGetPos(&curX, &curY)
    GetMonitorRectAt(curX, curY, &mL, &mT, &mR, &mB, &mW, &mH)

    mainSize := MeasureHudText(gHudTextMain, mainStr)
    subSize := MeasureHudText(gHudTextSub, subStr)
    lineH := Max(mainSize.h, subSize.h)
    lineGap := 0
    paddingX := Round(lineH * 0.5)
    paddingY := Round(lineH * 0.5)
    minContentW := lineH * 9
    maxContentW := Max(minContentW, Min(720, Round(mW * 0.8)) - paddingX * 2)
    contentW := Min(Max(mainSize.w, subSize.w, minContentW), maxContentW)
    subY := paddingY + lineH + lineGap
    hudW := contentW + paddingX * 2
    hudH := subY + lineH + paddingY

    gHudTextMain.Move(paddingX, paddingY, contentW, lineH)
    gHudTextSub.Move(paddingX, subY, contentW, lineH)

    hudX := mL + (mW - hudW) // 2
    hudY := mT + (mH * 3) // 4 - (hudH // 2) ; Exactly at Y 3/4 of current monitor
    gHudGui.Show("x" . hudX . " y" . hudY . " w" . hudW . " h" . hudH . " NoActivate")
}

ScheduleHideGestureOSD() {
    global gOsdDurationMs
    if (gOsdDurationMs <= 0)
        HideGestureOSD()
    else
        SetTimer(HideGestureOSD, -gOsdDurationMs)
}

HideGestureOSD() {
    global gHudGui
    if (gHudGui != "") {
        gHudGui.Hide()
    }
    ClearTrail()
}

; ------------------------------------------------------------------------------
; Spatial Screen Context (Hot Corners & Edges) - Multi-Monitor Aware
; Corner tolerance: 4 pixels. Priority: Hot Corner > Edge Split
; ------------------------------------------------------------------------------
GetSpatialContext(x, y) {
    GetMonitorRectAt(x, y, &mL, &mT, &mR, &mB, &mW, &mH)
    return SpatialContextInRect(x, y, mL, mT, mR, mB)
}

SpatialContextInRect(x, y, mL, mT, mR, mB) {
    cTol := 4

    ; 1. Hot Corners of current active monitor (Highest Priority)
    if (x <= mL + cTol && y <= mT + cTol)
        return "CornerTL"
    if (x >= mR - cTol && y <= mT + cTol)
        return "CornerTR"
    if (x <= mL + cTol && y >= mB - cTol)
        return "CornerBL"
    if (x >= mR - cTol && y >= mB - cTol)
        return "CornerBR"

    ; 2. Screen Edges of current monitor
    if (y <= mT + 1)
        return x < (mL + mR) / 2 ? "EdgeTopLeftHalf" : "EdgeTopRightHalf"
    if (y >= mB - 2)
        return x < (mL + mR) / 2 ? "EdgeBottomLeftHalf" : "EdgeBottomRightHalf"
    if (x <= mL + 1)
        return y < (mT + mB) / 2 ? "EdgeLeftTopHalf" : "EdgeLeftBottomHalf"
    if (x >= mR - 2)
        return y < (mT + mB) / 2 ? "EdgeRightTopHalf" : "EdgeRightBottomHalf"

    return ""
}

SpatialWholeEdge(trigger) {
    switch trigger {
        case "EdgeTopLeftHalf", "EdgeTopRightHalf": return "EdgeTop"
        case "EdgeBottomLeftHalf", "EdgeBottomRightHalf": return "EdgeBottom"
        case "EdgeLeftTopHalf", "EdgeLeftBottomHalf": return "EdgeLeft"
        case "EdgeRightTopHalf", "EdgeRightBottomHalf": return "EdgeRight"
    }
    return ""
}

GestureTriggerMatches(trigger, candidate) {
    return trigger == candidate || (SpatialWholeEdge(trigger) != "" && SpatialWholeEdge(trigger) == candidate)
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
                ScheduleHideGestureOSD()
                gFnDispatchGestureAction(spatial, "", procName)
            }
        }
    } else {
        gLastCorner := ""
    }
}
; Adopt the host's pause state immediately; a flag may survive an engine restart.
UpdatePauseState()
SetTimer(UpdatePauseState, 200)
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
        ScheduleHideGestureOSD()
        return
    }

    if (gState == STATE_PENDING) {
        ; Normal click passthrough
        gState := STATE_IDLE
        HideGestureOSD()
        if !gFnDispatchGestureAction(gTrigger, "", gStartProcess)
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
        ScheduleHideGestureOSD()
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
    ScheduleHideGestureOSD()

    ; Try dispatching to spatial binding (e.g. EdgeTopR + WU)
    dispatched := gFnDispatchGestureAction(spatial, wheelDir, procName)
    if (dispatched)
        return true

    ; Built-in fallback: EdgeTop volume control if no custom binding matched
    if (spatial == "EdgeTop" || SpatialWholeEdge(spatial) == "EdgeTop") {
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
    global gSteps, gIsPaused

    if (gIsPaused)
        return false

    if (gState != STATE_PENDING && gState != STATE_DRAWING)
        return false

    gChordWheelTriggered := true
    if (InStr(gTrigger, "+") || gSteps.Length > 0)
        return true
    SetTimer(TrackGesture, 0)
    LogGesture("Chord Wheel: Trigger=" . gTrigger . " Wheel=" . wheelDir . " Process=" . gStartProcess)
    UpdateGestureOSD(gTrigger, [wheelDir], gStartProcess)
    ScheduleHideGestureOSD()

    gFnDispatchGestureAction(gTrigger, wheelDir, gStartProcess)
    return true
}

; ------------------------------------------------------------------------------
; Hotkey Hooks for RButton, XButton1, XButton2
; ------------------------------------------------------------------------------
#HotIf ShouldCaptureMouse("RButton")
*RButton::OnMouseDown("RButton")
#HotIf gCapturedButtons.Has("RButton")
*RButton Up::OnMouseUp("RButton")
#HotIf ShouldCaptureMouse("MButton")
*MButton::OnMouseDown("MButton")
#HotIf gCapturedButtons.Has("MButton")
*MButton Up::OnMouseUp("MButton")
#HotIf ShouldCaptureMouse("LButton")
*LButton::OnMouseDown("LButton")
#HotIf gCapturedButtons.Has("LButton")
*LButton Up::OnMouseUp("LButton")
#HotIf ShouldCaptureMouse("XButton1")
*XButton1::OnMouseDown("XButton1")
#HotIf gCapturedButtons.Has("XButton1")
*XButton1 Up::OnMouseUp("XButton1")
#HotIf ShouldCaptureMouse("XButton2")
*XButton2::OnMouseDown("XButton2")
#HotIf gCapturedButtons.Has("XButton2")
*XButton2 Up::OnMouseUp("XButton2")
#HotIf

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
