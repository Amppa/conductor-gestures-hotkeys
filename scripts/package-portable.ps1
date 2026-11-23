[CmdletBinding()]
param(
    [string]$OutputDirectory
)

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrEmpty($OutputDirectory)) {
    $OutputDirectory = Join-Path $projectRoot "release\Conductor-portable"
}

$releaseExecutable = Join-Path $projectRoot "src-tauri\target\release\conductor.exe"
$autoHotkeySource = Join-Path $projectRoot "vendor\autohotkey"
$engineSource = Join-Path $projectRoot "engine\GestureEngine.ahk"
$readmeSource = Join-Path $projectRoot "docs\PORTABLE.md"
$zipPath = "$OutputDirectory.zip"

foreach ($path in @($releaseExecutable, $autoHotkeySource, $engineSource, $readmeSource)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Required portable package input is missing: $path"
    }
}

if (Test-Path -LiteralPath $OutputDirectory) {
    throw "Portable output directory already exists: $OutputDirectory"
}
if (Test-Path -LiteralPath $zipPath) {
    throw "Portable archive already exists: $zipPath"
}

New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
New-Item -ItemType Directory -Path (Join-Path $OutputDirectory "resources\vendor\autohotkey") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $OutputDirectory "resources\engine") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $OutputDirectory "data\runtime") -Force | Out-Null
New-Item -ItemType File -Path (Join-Path $OutputDirectory "portable.flag") | Out-Null

Copy-Item -LiteralPath $releaseExecutable -Destination (Join-Path $OutputDirectory "Conductor.exe")
Copy-Item -LiteralPath (Join-Path $autoHotkeySource "AutoHotkey64.exe") -Destination (Join-Path $OutputDirectory "resources\vendor\autohotkey\AutoHotkey64.exe")
Copy-Item -LiteralPath (Join-Path $autoHotkeySource "license.txt") -Destination (Join-Path $OutputDirectory "resources\vendor\autohotkey\license.txt")
Copy-Item -LiteralPath $engineSource -Destination (Join-Path $OutputDirectory "resources\engine\GestureEngine.ahk")
Copy-Item -LiteralPath $readmeSource -Destination (Join-Path $OutputDirectory "README.md")

Compress-Archive -Path $OutputDirectory -DestinationPath $zipPath
Write-Output "Created portable package: $zipPath"
