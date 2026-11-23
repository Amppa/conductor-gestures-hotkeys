#Requires -Version 5.1
<#
.SYNOPSIS
    Conductor local release script.

.DESCRIPTION
    Bumps the version across package.json / tauri.conf.json / Cargo.toml,
    runs the full verify gate, builds the Tauri executable in release mode,
    packages the portable ZIP, and creates a git tag.

.PARAMETER Version
    Target version string, e.g.  0.1.0

.PARAMETER SkipVerify
    Skip npm run verify (useful when verify was already run just before).

.EXAMPLE
    .\scripts\release.ps1 -Version 0.1.0
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string]$Version,

    [switch]$SkipVerify
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$releaseDir  = Join-Path $projectRoot "release"

function Write-Step([string]$msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Assert-CleanGit {
    $dirty = git -C $projectRoot status --porcelain 2>&1
    if ($dirty) {
        throw "Working tree is not clean. Please commit or stash changes before releasing.`n$dirty"
    }
}

# ─── 0. Guard: clean working tree ────────────────────────────────────────────
Write-Step "Checking git working tree"
Assert-CleanGit

# ─── 1. Bump version in all three manifests ──────────────────────────────────
Write-Step "Bumping version to $Version"

# package.json
$pkgPath = Join-Path $projectRoot "package.json"
$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
$pkg.version = $Version
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($pkgPath, ($pkg | ConvertTo-Json -Depth 10), $utf8NoBom)

# tauri.conf.json
$tauriConfPath = Join-Path $projectRoot "src-tauri\tauri.conf.json"
$tauriConf = Get-Content $tauriConfPath -Raw | ConvertFrom-Json
$tauriConf.version = $Version
[System.IO.File]::WriteAllText($tauriConfPath, ($tauriConf | ConvertTo-Json -Depth 10), $utf8NoBom)

# Cargo.toml  (simple line replacement – avoids a full TOML parser dependency)
$cargoPath = Join-Path $projectRoot "src-tauri\Cargo.toml"
$cargo = (Get-Content $cargoPath) -replace '^version\s*=\s*".*"', "version = `"$Version`""
[System.IO.File]::WriteAllText($cargoPath, ($cargo -join "`n") + "`n", $utf8NoBom)

Write-Host "    package.json, tauri.conf.json, Cargo.toml -> $Version" -ForegroundColor Green

# ─── 2. Quality gate ─────────────────────────────────────────────────────────
if (-not $SkipVerify) {
    Write-Step "Running full verify gate (npm run verify)"
    Push-Location $projectRoot
    try {
        npm run verify
        if ($LASTEXITCODE -ne 0) { throw "verify gate failed" }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "    -SkipVerify specified, skipping verify gate." -ForegroundColor Yellow
}

# ─── 3. Tauri release build ──────────────────────────────────────────────────
Write-Step "Building Tauri release binary (--no-bundle)"
Push-Location $projectRoot
try {
    npm run tauri -- build --no-bundle
    if ($LASTEXITCODE -ne 0) { throw "tauri build failed" }
} finally {
    Pop-Location
}

# ─── 4. Package portable ZIP ─────────────────────────────────────────────────
Write-Step "Packaging portable ZIP"

# Clean previous release artifacts for this version so the script is idempotent
$portableDir = Join-Path $releaseDir "Conductor-portable"
$portableZip = "$portableDir.zip"
if (Test-Path $portableDir) { Remove-Item $portableDir -Recurse -Force }
if (Test-Path $portableZip) { Remove-Item $portableZip -Force }

& (Join-Path $PSScriptRoot "package-portable.ps1") -OutputDirectory $portableDir
if ($LASTEXITCODE -ne 0) { throw "package-portable.ps1 failed" }

# Rename zip to include version: Conductor-v0.1.0-portable.zip
$versionedZip = Join-Path $releaseDir "Conductor-v$Version-portable.zip"
if (Test-Path $versionedZip) { Remove-Item $versionedZip -Force }
Move-Item $portableZip $versionedZip

Write-Host "    $versionedZip" -ForegroundColor Green

# ─── 5. Commit version bump + tag ────────────────────────────────────────────
Write-Step "Committing version bump and creating git tag v$Version"
git -C $projectRoot add "package.json" "src-tauri/tauri.conf.json" "src-tauri/Cargo.toml"
git -C $projectRoot commit -m "chore(release): bump version to $Version"
git -C $projectRoot tag -a "v$Version" -m "Release v$Version"

Write-Host "`n[OK] Release v$Version complete!" -ForegroundColor Green
Write-Host "     Portable ZIP : $versionedZip"
Write-Host "     Git tag      : v$Version"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  git push origin main --tags"
