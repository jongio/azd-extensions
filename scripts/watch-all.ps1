#!/usr/bin/env pwsh
# Watch all azd extensions for changes and auto-rebuild.
# Runs 'mage watch' (azd x watch) in each sibling extension repo concurrently,
# with color-coded prefixed output so you can see which extension is rebuilding.
#
# Usage: pwsh scripts/watch-all.ps1
# Stop:  Ctrl+C

$ErrorActionPreference = 'Stop'

# Ensure UTF-8 output for emoji/unicode characters from azd CLI
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoDir = Split-Path -Parent $scriptDir
$parentDir = Split-Path -Parent $repoDir

# Extension repos relative to the parent directory
$extensions = @(
    @{ Name = "app";     Color = "Cyan";    Path = Join-Path $parentDir "azd-app\cli" },
    @{ Name = "copilot"; Color = "Magenta"; Path = Join-Path $parentDir "azd-copilot\cli" },
    @{ Name = "exec";    Color = "Green";   Path = Join-Path $parentDir "azd-exec\cli" }
)

# Validate all repos exist before starting
$missing = @()
foreach ($ext in $extensions) {
    if (-not (Test-Path $ext.Path)) {
        $missing += "$($ext.Name) ($($ext.Path))"
    }
}
if ($missing.Count -gt 0) {
    Write-Host "Missing extension repos:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    exit 1
}

Write-Host ""
Write-Host "Watching all extensions for changes..." -ForegroundColor White
Write-Host "   Press Ctrl+C to stop all watchers" -ForegroundColor DarkGray
Write-Host ""

# Thread-safe queue for collecting output from all watchers
$outputQueue = [System.Collections.Concurrent.ConcurrentQueue[PSCustomObject]]::new()

$processes = @()

foreach ($ext in $extensions) {
    $name = $ext.Name
    $color = $ext.Color
    $cliDir = $ext.Path

    Write-Host "   [$name] watching $cliDir" -ForegroundColor $color

    # Launch mage watch as a background process with UTF-8 output capture
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = "mage"
    $psi.Arguments = "watch"
    $psi.WorkingDirectory = $cliDir
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8
    $psi.CreateNoWindow = $true

    $proc = [System.Diagnostics.Process]::new()
    $proc.StartInfo = $psi
    $proc.EnableRaisingEvents = $true

    # Capture references for the closure
    $queue = $outputQueue
    $extName = $name
    $extColor = $color

    # Register async output handlers that enqueue lines
    Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action {
        if ($EventArgs.Data) {
            $queue = $Event.MessageData.Queue
            $queue.Enqueue([PSCustomObject]@{
                Name  = $Event.MessageData.Name
                Color = $Event.MessageData.Color
                Line  = $EventArgs.Data
            })
        }
    } -MessageData @{ Queue = $queue; Name = $extName; Color = $extColor } | Out-Null

    Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived -Action {
        if ($EventArgs.Data) {
            $queue = $Event.MessageData.Queue
            $queue.Enqueue([PSCustomObject]@{
                Name  = $Event.MessageData.Name
                Color = $Event.MessageData.Color
                Line  = $EventArgs.Data
            })
        }
    } -MessageData @{ Queue = $queue; Name = $extName; Color = $extColor } | Out-Null

    $proc.Start() | Out-Null
    $proc.BeginOutputReadLine()
    $proc.BeginErrorReadLine()

    $processes += @{ Process = $proc; Name = $name }
}

Write-Host ""
Write-Host "-------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

try {
    while ($true) {
        # Drain output queue
        $item = $null
        while ($outputQueue.TryDequeue([ref]$item)) {
            $prefix = "[$($item.Name)]"
            $line = "$prefix $($item.Line)"

            if ($item.Line -match "ERROR|FAIL|Failed") {
                Write-Host $line -ForegroundColor Red
            } else {
                Write-Host $line -ForegroundColor $item.Color
            }
        }

        # Check if any process has exited
        foreach ($entry in $processes) {
            if ($entry.Process.HasExited) {
                Write-Host "[$($entry.Name)] watcher exited with code $($entry.Process.ExitCode)" -ForegroundColor Yellow
                Write-Host "`nA watcher has stopped. Stopping all..." -ForegroundColor Yellow
                throw "watcher-exited"
            }
        }

        Start-Sleep -Milliseconds 200
    }
} catch {
    if ($_.Exception.Message -ne "watcher-exited") { throw }
} finally {
    Write-Host "Stopping all watchers..." -ForegroundColor Yellow
    foreach ($entry in $processes) {
        if (-not $entry.Process.HasExited) {
            $entry.Process.Kill($true)
            $entry.Process.WaitForExit(5000) | Out-Null
        }
        $entry.Process.Dispose()
    }
    Get-EventSubscriber | Unregister-Event -ErrorAction SilentlyContinue
    Write-Host "Done." -ForegroundColor Green
}
