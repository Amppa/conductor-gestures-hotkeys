param(
    [string]$TestScript = "RunTest.ahk"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$engineSource = Join-Path $repoRoot "engine\GestureEngine.ahk"
$testSource = Join-Path $repoRoot "engine\tests\$TestScript"
$ahkExe = Join-Path $repoRoot "vendor\autohotkey\AutoHotkey64.exe"

foreach ($required in @($ahkExe, $engineSource, $testSource)) {
    if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
        throw "Required file not found: $required"
    }
}

# Run against a temporary copy so the suite always exercises the tracked engine
# and never touches the user's runtime directory.
$workDir = Join-Path ([System.IO.Path]::GetTempPath()) ("conductor-engine-test-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $workDir | Out-Null

$exitCode = 1
$keepWorkDir = $true

try {
    $workTestsDir = Join-Path $workDir "tests"
    New-Item -ItemType Directory -Path $workTestsDir | Out-Null
    Copy-Item -LiteralPath $engineSource -Destination (Join-Path $workDir "GestureEngine.ahk")
    Copy-Item -LiteralPath $testSource -Destination (Join-Path $workTestsDir $TestScript)

    $resultPath = Join-Path $workTestsDir "test_result.json"
    $stdoutPath = Join-Path $workDir "stdout.log"
    $stderrPath = Join-Path $workDir "stderr.log"

    $process = Start-Process `
        -FilePath $ahkExe `
        -ArgumentList "/ErrorStdOut", "`"$TestScript`"" `
        -WorkingDirectory $workTestsDir `
        -Wait `
        -PassThru `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath

    foreach ($logPath in @($stdoutPath, $stderrPath)) {
        if (Test-Path -LiteralPath $logPath -PathType Leaf) {
            $logText = Get-Content -LiteralPath $logPath -Raw -Encoding UTF8
            if ($null -ne $logText) {
                $logText = $logText.Trim()
                if ($logText) {
                    Write-Output $logText
                }
            }
        }
    }

    if (-not (Test-Path -LiteralPath $resultPath -PathType Leaf)) {
        throw "Engine test did not produce a result file (ExitCode=$($process.ExitCode))."
    }

    $resultJson = Get-Content -LiteralPath $resultPath -Raw -Encoding UTF8
    Write-Output $resultJson

    $result = $resultJson | ConvertFrom-Json
    $testCases = @($result.tests)
    if ($testCases.Count -eq 0) {
        throw "Engine test result contains no test cases."
    }

    $failedTests = @($testCases | Where-Object { -not $_.pass })
    $passed = $process.ExitCode -eq 0 -and $result.allPassed -eq $true -and $failedTests.Count -eq 0

    if ($passed) {
        $exitCode = 0
        $keepWorkDir = $false
        Write-Output "Engine tests passed: $($testCases.Count) case(s)."
    } else {
        $failedNames = ($failedTests | ForEach-Object { $_.name }) -join ", "
        if (-not $failedNames) {
            $failedNames = "unknown"
        }
        Write-Output "Engine tests failed (ExitCode=$($process.ExitCode), Failed=$failedNames)."
    }
} catch {
    Write-Output "Engine test run failed: $($_.Exception.Message)"
} finally {
    if ($keepWorkDir) {
        Write-Output "Work directory kept for inspection: $workDir"
    } else {
        Remove-Item -LiteralPath $workDir -Recurse -Force
    }
}

exit $exitCode
