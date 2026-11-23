#Requires -Version 5.1
[CmdletBinding()]
param(
    [string]$ConfigPath,
    [switch]$EnableStartup
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$release = (New-Item -ItemType Directory -Force -Path (Join-Path $root "release")).FullName
$portable = Join-Path $release "Conductor-portable"
$exe = Join-Path $portable "Conductor.exe"
$activeScript = Join-Path $portable "data\runtime\ActiveGestures.ahk"
$runId = [guid]::NewGuid().ToString("N")
$stage = Join-Path $release "staging-$runId"
$candidate = Join-Path $stage "Conductor-portable"
$backup = Join-Path $release "previous-$runId"

if ($ConfigPath) {
    $ConfigPath = (Resolve-Path -LiteralPath $ConfigPath).Path
    if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
        throw "ConfigPath must point to a file."
    }
}
if ((Test-Path -LiteralPath $portable) -and
    (-not (Test-Path -LiteralPath (Join-Path $portable "portable.flag") -PathType Leaf) -or
     (Get-Item -LiteralPath $portable).Attributes.HasFlag([IO.FileAttributes]::ReparsePoint))) {
    throw "The existing portable directory must be a regular directory with portable.flag."
}

$runningApp = @(Get-CimInstance Win32_Process -Filter "Name='Conductor.exe'" |
    Where-Object { $_.ExecutablePath -eq $exe })
$runningEngine = @(Get-CimInstance Win32_Process -Filter "Name='AutoHotkey64.exe'" |
    Where-Object { $_.CommandLine -match ('"' + [regex]::Escape($activeScript) + '"\s*$') })

try {
    foreach ($process in ($runningApp + $runningEngine)) {
        $handle = Get-Process -Id $process.ProcessId -ErrorAction SilentlyContinue
        if ($handle) {
            $handle.Kill()
            if (-not $handle.WaitForExit(5000)) {
                throw "Process $($process.ProcessId) did not exit."
            }
        }
    }

    Push-Location -LiteralPath $root
    try {
        & npm.cmd run tauri -- build --no-bundle
        if ($LASTEXITCODE -ne 0) { throw "Conductor build failed." }
    } finally {
        Pop-Location
    }

    New-Item -ItemType Directory -Path $stage | Out-Null
    & (Join-Path $PSScriptRoot "package-portable.ps1") -OutputDirectory $candidate
    $oldData = Join-Path $portable "data"
    $newData = Join-Path $candidate "data"
    if (Test-Path -LiteralPath $oldData -PathType Container) {
        Get-ChildItem -LiteralPath $oldData -Force | ForEach-Object {
            Copy-Item -LiteralPath $_.FullName -Destination $newData -Recurse -Force
        }
    }
    if ($ConfigPath) {
        Copy-Item -LiteralPath $ConfigPath -Destination (Join-Path $newData "config.json") -Force
    }

    if (Test-Path -LiteralPath $portable) {
        Move-Item -LiteralPath $portable -Destination $backup
    }
    try {
        Move-Item -LiteralPath $candidate -Destination $portable
    } catch {
        if (Test-Path -LiteralPath $backup) {
            Move-Item -LiteralPath $backup -Destination $portable
        }
        throw
    }
    Copy-Item -LiteralPath "$candidate.zip" -Destination "$portable.zip" -Force
} catch {
    if (($runningApp.Count -or $runningEngine.Count) -and (Test-Path -LiteralPath $exe)) {
        Start-Process -FilePath $exe -WorkingDirectory $portable
    }
    throw
}

Start-Process -FilePath $exe -WorkingDirectory $portable
if ($EnableStartup) {
    $startup = [Environment]::GetFolderPath("Startup")
    $shortcutPath = Join-Path $startup "Conductor Portable.lnk"
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $exe
    $shortcut.WorkingDirectory = $portable
    $shortcut.Save()
}
