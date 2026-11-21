param(
    [string]$TestScript = "RunTest.ahk"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot "runtime"
$ahkExe = Join-Path $repoRoot "vendor\autohotkey\AutoHotkey64.exe"
$testScriptPath = Join-Path $runtimeDir $TestScript
$resultPath = Join-Path $runtimeDir "test_result.json"

if (-not (Test-Path -LiteralPath $ahkExe -PathType Leaf)) {
    throw "AutoHotkey executable not found: $ahkExe"
}

if (-not (Test-Path -LiteralPath $testScriptPath -PathType Leaf)) {
    throw "Engine test script not found: $testScriptPath"
}

if (Test-Path -LiteralPath $resultPath -PathType Leaf) {
    Remove-Item -LiteralPath $resultPath -Force
}

$process = Start-Process `
    -FilePath $ahkExe `
    -ArgumentList "/ErrorStdOut $TestScript" `
    -WorkingDirectory $runtimeDir `
    -Wait `
    -PassThru

if (-not (Test-Path -LiteralPath $resultPath -PathType Leaf)) {
    throw "Engine test did not produce a result file: $resultPath"
}

$resultJson = Get-Content -LiteralPath $resultPath -Raw
Write-Output $resultJson

try {
    $result = $resultJson | ConvertFrom-Json
} catch {
    throw "Engine test result is not valid JSON: $($_.Exception.Message)"
}

$failedTests = @($result.tests | Where-Object { -not $_.pass })
$allPassed = $result.allPassed -eq $true -and $failedTests.Count -eq 0

if ($process.ExitCode -ne 0 -or -not $allPassed) {
    $failedNames = ($failedTests | ForEach-Object { $_.name }) -join ", "
    if (-not $failedNames) {
        $failedNames = "unknown"
    }
    Write-Error "Engine acceptance tests failed (ExitCode=$($process.ExitCode), Failed=$failedNames)"
    exit 1
}
