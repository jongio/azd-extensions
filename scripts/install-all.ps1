#!/usr/bin/env pwsh
# Install all azd extensions locally by running 'mage build' in each sibling extension repo.
# This builds and installs each extension using 'azd x build'.
#
# First-time setup: ensures the jongio extension source is registered and each extension
# is installed from the registry (so azd knows about it). Subsequent runs just rebuild
# the binary in-place via 'azd x build'.

# Extension list: keep in sync with scripts/lib/extensions.js

$ErrorActionPreference = 'Stop'

# Ensure UTF-8 output for emoji/unicode characters from azd CLI
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$env:PYTHONIOENCODING = "utf-8"
chcp 65001 | Out-Null

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoDir = Split-Path -Parent $scriptDir
$parentDir = Split-Path -Parent $repoDir

$registrySource = "jongio"
$registryUrl = "https://jongio.github.io/azd-extensions/registry.json"

# Extension repos relative to the parent directory
$extensions = @(
    @{ Name = "azd-app";     Id = "jongio.azd.app";     Path = Join-Path $parentDir "azd-app\cli" },
    @{ Name = "azd-rest";    Id = "jongio.azd.rest";    Path = Join-Path $parentDir "azd-rest\cli" }
)

# Ensure the jongio extension source is registered
function Ensure-ExtensionSource {
    $sources = azd extension source list 2>&1 | Out-String
    if ($sources -notmatch $registrySource) {
        Write-Host "📦 Adding '$registrySource' extension source..." -ForegroundColor Cyan
        azd extension source add --name $registrySource --type url --location $registryUrl 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ⚠️  Failed to add extension source, continuing anyway" -ForegroundColor Yellow
        }
    }
}

# NOTE: Direct config.json manipulation is an interim workaround until azd CLI supports
# local extension registration natively (e.g., 'azd extension install --local <path>').
# This function assumes the azd config schema at ~/.azd/config.json with the structure:
#   { "extension": { "installed": { "<id>": { ... } } } }
# If azd changes its config format, this function will need updating.
function Ensure-ExtensionRegistered {
    param(
        [string]$ExtensionId,
        [string]$CliDir,
        [PSCustomObject]$Config
    )

    $installed = $Config.extension.installed
    if ($installed -and ($installed | Get-Member -Name $ExtensionId -ErrorAction SilentlyContinue)) {
        return $true
    }

    # Try installing from registry first
    Write-Host "    First-time setup: registering $ExtensionId..." -ForegroundColor Gray
    azd extension install $ExtensionId --source $registrySource --force 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        return $true
    }

    # Not in registry — register locally from extension.yaml
    Write-Host "    Not in registry, registering locally from extension.yaml..." -ForegroundColor Gray
    $extYamlPath = Join-Path $CliDir "extension.yaml"
    if (-not (Test-Path $extYamlPath)) {
        Write-Host "    ⚠️  extension.yaml not found, skipping registration" -ForegroundColor Yellow
        return $false
    }

    # Parse extension.yaml for required fields
    $yaml = Get-Content $extYamlPath -Raw
    $namespace = if ($yaml -match 'namespace:\s*(\S+)') { $matches[1] } else { "" }
    $displayName = if ($yaml -match 'displayName:\s*(.+)') { $matches[1].Trim() } else { $ExtensionId }
    $description = if ($yaml -match 'description:\s*(.+)') { $matches[1].Trim() } else { "" }
    $version = if ($yaml -match 'version:\s*(\S+)') { $matches[1] } else { "0.0.0" }
    $usage = if ($yaml -match 'usage:\s*(.+)') { $matches[1].Trim() } else { "" }

    # Determine binary path
    $os = if ($IsWindows -or $env:OS -eq "Windows_NT") { "windows" } else { if ($IsMacOS) { "darwin" } else { "linux" } }
    $arch = if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq "Arm64") { "arm64" } else { "amd64" }
    $ext = if ($os -eq "windows") { ".exe" } else { "" }
    $binaryName = ($ExtensionId -replace '\.', '-') + "-$os-$arch$ext"
    $relativePath = "extensions\$ExtensionId\$binaryName"

    # Update config.json — re-read to pick up any changes from 'azd extension install' above
    $configPath = Join-Path $env:USERPROFILE ".azd\config.json"
    $localConfig = if (Test-Path $configPath) {
        try {
            Get-Content $configPath -Raw | ConvertFrom-Json
        } catch {
            Write-Host "    Warning: could not parse config.json, treating as empty" -ForegroundColor Yellow
            [PSCustomObject]@{}
        }
    } else {
        [PSCustomObject]@{}
    }

    if (-not $localConfig.extension) {
        $localConfig | Add-Member -NotePropertyName "extension" -NotePropertyValue ([PSCustomObject]@{})
    }
    if (-not $localConfig.extension.installed) {
        $localConfig.extension | Add-Member -NotePropertyName "installed" -NotePropertyValue ([PSCustomObject]@{})
    }

    $extEntry = [PSCustomObject]@{
        id = $ExtensionId
        namespace = $namespace
        capabilities = @("custom-commands")
        displayName = $displayName
        description = $description
        version = $version
        usage = $usage
        path = $relativePath
        source = "local"
    }

    $localConfig.extension.installed | Add-Member -NotePropertyName $ExtensionId -NotePropertyValue $extEntry -Force
    $localConfig | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
    return $true
}

$failed = @()
$succeeded = @()
$skipped = @()

Write-Host "`n🚀 Installing all azd extensions locally...`n" -ForegroundColor Cyan

Ensure-ExtensionSource

# Read config.json once for all registration checks (#66 — avoid N+1 reads)
$configPath = Join-Path $env:USERPROFILE ".azd\config.json"
$config = if (Test-Path $configPath) {
    try {
        Get-Content $configPath -Raw | ConvertFrom-Json
    } catch {
        Write-Host "  Warning: could not parse config.json, treating as empty" -ForegroundColor Yellow
        [PSCustomObject]@{}
    }
} else {
    [PSCustomObject]@{}
}

# Phase 1: Register all extensions sequentially (may invoke azd CLI)
$buildable = @()
foreach ($ext in $extensions) {
    $name = $ext.Name
    $id = $ext.Id
    $cliDir = $ext.Path

    if (-not (Test-Path $cliDir)) {
        Write-Host "  ⚠️  $name — not found at $cliDir, skipping" -ForegroundColor Yellow
        $skipped += $name
        continue
    }

    Ensure-ExtensionRegistered -ExtensionId $id -CliDir $cliDir -Config $config | Out-Null
    $buildable += $ext
}

# Phase 2: Launch all builds concurrently (#65 — parallel mage build)
$buildJobs = @()
foreach ($ext in $buildable) {
    $name = $ext.Name
    $cliDir = $ext.Path

    Write-Host "  Launching build for $name..." -ForegroundColor White

    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = "mage"
    $psi.Arguments = "build"
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

    $outputLines = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()

    Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action {
        if ($EventArgs.Data) {
            $Event.MessageData.Enqueue($EventArgs.Data)
        }
    } -MessageData $outputLines | Out-Null

    Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived -Action {
        if ($EventArgs.Data) {
            $Event.MessageData.Enqueue($EventArgs.Data)
        }
    } -MessageData $outputLines | Out-Null

    $proc.Start() | Out-Null
    $proc.BeginOutputReadLine()
    $proc.BeginErrorReadLine()

    $buildJobs += @{ Process = $proc; Name = $name; Output = $outputLines }
}

# Phase 3: Wait for all builds and collect results
foreach ($job in $buildJobs) {
    $job.Process.WaitForExit()

    # Small delay to let async event handlers flush
    Start-Sleep -Milliseconds 200

    # Drain and display output
    $line = $null
    while ($job.Output.TryDequeue([ref]$line)) {
        Write-Host "    $line" -ForegroundColor Gray
    }

    if ($job.Process.ExitCode -ne 0) {
        $failed += $job.Name
        Write-Host "  ❌ $($job.Name) failed (exit code $($job.Process.ExitCode))" -ForegroundColor Red
    } else {
        $succeeded += $job.Name
        Write-Host "  ✅ $($job.Name) installed" -ForegroundColor Green
    }

    $job.Process.Dispose()
    Write-Host ""
}

Get-EventSubscriber | Where-Object { $_.SourceObject -eq $null } | Unregister-Event -ErrorAction SilentlyContinue

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Results: $($succeeded.Count) installed, $($failed.Count) failed, $($skipped.Count) skipped" -ForegroundColor Cyan

if ($succeeded.Count -gt 0) {
    Write-Host "  ✅ $($succeeded -join ', ')" -ForegroundColor Green
}
if ($failed.Count -gt 0) {
    Write-Host "  ❌ $($failed -join ', ')" -ForegroundColor Red
}
if ($skipped.Count -gt 0) {
    Write-Host "  ⚠️  $($skipped -join ', ')" -ForegroundColor Yellow
}

Write-Host ""

if ($failed.Count -gt 0) {
    exit 1
}
