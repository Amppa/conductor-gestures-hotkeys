#Requires AutoHotkey v2.0
#SingleInstance Force

; ==============================================================================
; MouseGesture 5Btn - Automated Acceptance Test Suite (TDD)
; Tests:
; 1. Rightwards gesture: RButton -> R -> Dispatches Hello World
; 2. L-Shape gesture: RButton -> D,R -> Dispatches Close Tab
; 3. Chord Wheel: RButton + WU -> Dispatches Prev Tab
; 4. Diagonal gesture: RButton -> DR (8-direction single diagonal)
; 5. Stroke plus Chord Wheel: RButton -> R then WU -> Dispatches R,WU
; 6. Pause flag: resets gesture state, suspends hotkeys, blocks chord wheel
; 7. Removing the pause flag resumes hotkeys
; ==============================================================================

#Include "..\GestureEngine.ahk"

global gTestResults := []

; Mock Environment
global gFnIsProcessDisabled := (proc) => false

DispatchHandler(trigger, steps, proc) {
    global gLastDispatched := { trigger: trigger, steps: steps, proc: proc }
    return true
}

global gFnDispatchGestureAction := DispatchHandler
global gFnGetGestureActionName := (trigger, steps, proc) => ""
global gLastDispatched := { trigger: "", steps: "", proc: "" }

; ------------------------------------------------------------------------------
; Stream Simulator
; ------------------------------------------------------------------------------
SimulateGestureStream(btnName, coords) {
    global gState, gTrigger, gStartX, gStartY, gLastX, gLastY, gSteps, gThreshold, gStepThreshold

    start := coords[1]
    gState := STATE_PENDING
    gTrigger := btnName
    gStartX := start[1]
    gStartY := start[2]
    gLastX := start[1]
    gLastY := start[2]
    gSteps := []

    Loop coords.Length - 1 {
        pt := coords[A_Index + 1]
        curX := pt[1]
        curY := pt[2]

        dxTotal := curX - gStartX
        dyTotal := curY - gStartY
        totalDist := Sqrt(dxTotal * dxTotal + dyTotal * dyTotal)

        if (gState == STATE_PENDING) {
            if (totalDist >= gThreshold) {
                gState := STATE_DRAWING
                dir := GetDirection(dxTotal, dyTotal)
                gSteps.Push(dir)
                gLastX := curX
                gLastY := curY
            }
        } else if (gState == STATE_DRAWING) {
            dxStep := curX - gLastX
            dyStep := curY - gLastY
            stepDist := Sqrt(dxStep * dxStep + dyStep * dyStep)

            if (stepDist >= gStepThreshold) {
                dir := GetDirection(dxStep, dyStep)
                if (gSteps.Length == 0 || gSteps[gSteps.Length] != dir) {
                    gSteps.Push(dir)
                }
                gLastX := curX
                gLastY := curY
            }
        }
    }

    if (gState == STATE_DRAWING) {
        gState := STATE_IDLE
        stepStr := ""
        for i, s in gSteps {
            stepStr .= (i == 1 ? "" : ",") . s
        }
        gFnDispatchGestureAction(gTrigger, stepStr, "chrome.exe")
    }
}

; Test Case 1: Simple Rightwards (RButton: R)
gLastDispatched := { trigger: "", steps: "", proc: "" }
SimulateGestureStream("RButton", [
    [100, 100],
    [120, 100],
    [150, 100]
])
tc1_pass := (gLastDispatched.trigger = "RButton" && gLastDispatched.steps = "R")
gTestResults.Push({ name: "Rightwards Gesture (R)", pass: tc1_pass, actual: gLastDispatched.steps })

; Test Case 2: L-Shape Turn (Down then Right: D,R)
gLastDispatched := { trigger: "", steps: "", proc: "" }
SimulateGestureStream("RButton", [
    [100, 100],
    [100, 130],
    [100, 160], ; Downward >= 30px
    [130, 160],
    [160, 160]  ; Rightward >= 30px
])
tc2_pass := (gLastDispatched.trigger = "RButton" && gLastDispatched.steps = "D,R")
gTestResults.Push({ name: "L-Shape Gesture (D,R)", pass: tc2_pass, actual: gLastDispatched.steps })

; Test Case 3: 8-Direction Diagonal (DR)
gLastDispatched := { trigger: "", steps: "", proc: "" }
SimulateGestureStream("RButton", [
    [100, 100],
    [125, 125],
    [150, 150]
])
tc3_pass := (gLastDispatched.trigger = "RButton" && gLastDispatched.steps = "DR")
gTestResults.Push({ name: "Single Diagonal Gesture (DR)", pass: tc3_pass, actual: gLastDispatched.steps })

; Test Case 4: Chord Wheel (RButton held + WheelUp, no prior stroke)
gLastDispatched := { trigger: "", steps: "", proc: "" }
gState := STATE_PENDING
gTrigger := "RButton"
gSteps := []
gStartProcess := "chrome.exe"
HandleChordWheel("WU")
tc4_pass := (gLastDispatched.trigger = "RButton" && gLastDispatched.steps = "WU")
gTestResults.Push({ name: "Chord Wheel (RButton + WU)", pass: tc4_pass, actual: gLastDispatched.steps })

; Test Case 5: Chord Wheel after a stroke (R then WheelUp)
gLastDispatched := { trigger: "", steps: "", proc: "" }
gState := STATE_PENDING
gTrigger := "RButton"
gSteps := ["R"]
gStartProcess := "chrome.exe"
HandleChordWheel("WU")
tc5_pass := (gLastDispatched.trigger = "RButton" && gLastDispatched.steps = "R,WU")
gTestResults.Push({ name: "Stroke Plus Chord Wheel (R + WU)", pass: tc5_pass, actual: gLastDispatched.steps })

; Test Case 6: Pause flag suspends hotkeys, resets state, and blocks chord dispatch
gLastDispatched := { trigger: "", steps: "", proc: "" }
gIsPaused := false
gState := STATE_DRAWING
gSteps := ["R"]
gTrigger := "RButton"
pauseFlagPath := A_ScriptDir . "\paused.flag"
if FileExist(pauseFlagPath)
    FileDelete(pauseFlagPath)
FileAppend("1", pauseFlagPath)
UpdatePauseState()
resetOK := (gIsPaused && A_IsSuspended && gState == STATE_IDLE && gSteps.Length == 0)
gState := STATE_PENDING
chordResult := HandleChordWheel("WU")
tc6_pass := (resetOK && !chordResult && gLastDispatched.steps = "")
gTestResults.Push({ name: "Pause Flag Resets State And Blocks Chord", pass: tc6_pass, actual: "paused=" . (gIsPaused ? "true" : "false") })

; Test Case 7: Removing the flag resumes hotkeys
if FileExist(pauseFlagPath)
    FileDelete(pauseFlagPath)
UpdatePauseState()
gState := STATE_IDLE
tc7_pass := (!gIsPaused && !A_IsSuspended)
gTestResults.Push({ name: "Removing Pause Flag Resumes Hotkeys", pass: tc7_pass, actual: "paused=" . (gIsPaused ? "true" : "false") })

; Compile Summary Report to JSON
allPassed := true
jsonItems := ""
for i, item in gTestResults {
    if (!item.pass)
        allPassed := false
    jsonItems .= (i == 1 ? "" : ", ")
    jsonItems .= '{"name": "' . item.name . '", "pass": ' . (item.pass ? "true" : "false") . ', "actual": "' . item.actual . '"}'
}

finalJson := '{"allPassed": ' . (allPassed ? "true" : "false") . ', "tests": [' . jsonItems . ']}'
resultFile := A_ScriptDir . "\test_result.json"
try FileDelete(resultFile)
FileAppend(finalJson, resultFile, "UTF-8")

ExitApp(allPassed ? 0 : 1)
