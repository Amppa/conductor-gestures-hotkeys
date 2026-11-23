# Conductor Portable

Run `Conductor.exe` directly after extracting this folder. No installation or PowerShell session is required.

The `data` directory stores `config.json` and the generated runtime scripts. Keep it beside `Conductor.exe` when moving or backing up the application.

On first launch, Conductor creates the default configuration and generates `data/runtime/ActiveGestures.ahk`. Use Apply after changing settings to update the running gesture engine.

Do not remove `portable.flag` or the `resources` directory. They allow Conductor to use the local data directory and bundled AutoHotkey runtime.
