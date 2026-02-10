#!/usr/bin/env pwsh
# Uninstall all azd extensions that were installed by install-all.ps1.
# Stops running processes, uninstalls each extension, removes the registry source, and cleans up cache.

$ErrorActionPreference = 'Stop'

# Ensure UTF-8 output for emoji/unicode characters from azd CLI
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$env:PYTHONIOENCODING = "utf-8"
chcp 65001 | Out-Null

$registrySource = "jongio"

$extensions = @(
    @{ Name = "azd-exec";    Id = "jongio.azd.exec" },
    @{ Name = "azd-app";     Id = "jongio.azd.app" },
    @{ Name = "azd-copilot"; Id = "jongio.azd.copilot" }
)

Write-Host "`n🗑️  Uninstalling all azd extensions...`n" -ForegroundColor Cyan

# Kill any running extension processes
Write-Host "🛑 Stopping any running extension processes..." -ForegroundColor Gray
foreach ($ext in $extensions) {
    $processPrefix = ($ext.Id -replace '\.', '-')
    Get-Process | Where-Object { $_.Name -like "$processPrefix*" } | Stop-Process -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Milliseconds 500
Write-Host "   ✓" -ForegroundColor DarkGray

$failed = @()
$succeeded = @()

foreach ($ext in $extensions) {
    $name = $ext.Name
    $id = $ext.Id

    Write-Host "  [$($succeeded.Count + $failed.Count + 1)/$($extensions.Count)] Uninstalling $name..." -ForegroundColor White

    try {
        # Uninstall extension
        azd extension uninstall $id 2>&1 | Out-Null

        # Remove extension directory
        $extensionDir = Join-Path $env:USERPROFILE ".azd\extensions\$id"
        if (Test-Path $extensionDir) {
            Remove-Item -Path $extensionDir -Recurse -Force -ErrorAction SilentlyContinue
        }

        # Clean up cache
        $cacheDir = Join-Path $env:USERPROFILE ".azd\cache"
        if (Test-Path $cacheDir) {
            Get-ChildItem -Path $cacheDir -Filter "*$id*" -ErrorAction SilentlyContinue |
                Remove-Item -Force -ErrorAction SilentlyContinue
        }

        $succeeded += $name
        Write-Host "  ✅ $name uninstalled" -ForegroundColor Green
    } catch {
        $failed += $name
        Write-Host "  ❌ $name failed: $_" -ForegroundColor Red
    }

    Write-Host ""
}

# Remove the registry source
Write-Host "🔗 Removing '$registrySource' extension source..." -ForegroundColor Gray
azd extension source remove $registrySource 2>$null
Write-Host "   ✓" -ForegroundColor DarkGray

# Remove any PR registry sources
$sources = azd extension source list --output json 2>$null | ConvertFrom-Json
foreach ($source in $sources) {
    if ($source.name -match "^pr-\d+$") {
        azd extension source remove $source.name 2>$null
    }
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Results: $($succeeded.Count) uninstalled, $($failed.Count) failed" -ForegroundColor Cyan

if ($succeeded.Count -gt 0) {
    Write-Host "  ✅ $($succeeded -join ', ')" -ForegroundColor Green
}
if ($failed.Count -gt 0) {
    Write-Host "  ❌ $($failed -join ', ')" -ForegroundColor Red
}

Write-Host ""

if ($failed.Count -gt 0) {
    exit 1
}
