#!/usr/bin/env pwsh
# Install all azd extensions locally by running 'mage build' in each sibling extension repo.
# This builds and installs each extension using 'azd x build'.
#
# First-time setup: ensures the jongio extension source is registered and each extension
# is installed from the registry (so azd knows about it). Subsequent runs just rebuild
# the binary in-place via 'azd x build'.

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
    @{ Name = "azd-copilot"; Id = "jongio.azd.copilot"; Path = Join-Path $parentDir "azd-copilot\cli" },
    @{ Name = "azd-exec";    Id = "jongio.azd.exec";    Path = Join-Path $parentDir "azd-exec\cli" }
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

# Ensure an extension is registered in config.json (first-time install from registry,
# or local registration if not available in the registry)
function Ensure-ExtensionRegistered {
    param(
        [string]$ExtensionId,
        [string]$CliDir
    )

    $configPath = Join-Path $env:USERPROFILE ".azd\config.json"
    if (Test-Path $configPath) {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        $installed = $config.extension.installed
        if ($installed -and ($installed | Get-Member -Name $ExtensionId -ErrorAction SilentlyContinue)) {
            return $true
        }
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

    # Update config.json
    $config = if (Test-Path $configPath) {
        Get-Content $configPath -Raw | ConvertFrom-Json
    } else {
        [PSCustomObject]@{}
    }

    if (-not $config.extension) {
        $config | Add-Member -NotePropertyName "extension" -NotePropertyValue ([PSCustomObject]@{})
    }
    if (-not $config.extension.installed) {
        $config.extension | Add-Member -NotePropertyName "installed" -NotePropertyValue ([PSCustomObject]@{})
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

    $config.extension.installed | Add-Member -NotePropertyName $ExtensionId -NotePropertyValue $extEntry -Force
    $config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
    return $true
}

$failed = @()
$succeeded = @()
$skipped = @()

Write-Host "`n🚀 Installing all azd extensions locally...`n" -ForegroundColor Cyan

Ensure-ExtensionSource

foreach ($ext in $extensions) {
    $name = $ext.Name
    $id = $ext.Id
    $cliDir = $ext.Path

    if (-not (Test-Path $cliDir)) {
        Write-Host "  ⚠️  $name — not found at $cliDir, skipping" -ForegroundColor Yellow
        $skipped += $name
        continue
    }

    Write-Host "  [$($succeeded.Count + $failed.Count + 1)/$($extensions.Count)] Building $name..." -ForegroundColor White

    # Ensure extension is registered before building (needed for first-time setup)
    Ensure-ExtensionRegistered -ExtensionId $id -CliDir $cliDir | Out-Null

    try {
        # Use System.Diagnostics.Process with UTF-8 encoding for proper unicode output
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
        $proc.WaitForExit()

        # Small delay to let async event handlers flush
        Start-Sleep -Milliseconds 200

        # Drain and display output
        $line = $null
        while ($outputLines.TryDequeue([ref]$line)) {
            Write-Host "    $line" -ForegroundColor Gray
        }

        if ($proc.ExitCode -ne 0) {
            throw "mage build failed with exit code $($proc.ExitCode)"
        }
        $proc.Dispose()
        Get-EventSubscriber | Where-Object { $_.SourceObject -eq $null } | Unregister-Event -ErrorAction SilentlyContinue
        $succeeded += $name
        Write-Host "  ✅ $name installed" -ForegroundColor Green
    } catch {
        $failed += $name
        Write-Host "  ❌ $name failed: $_" -ForegroundColor Red
    }

    Write-Host ""
}

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
