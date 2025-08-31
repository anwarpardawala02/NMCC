#!/usr/bin/env pwsh
# Script to install Supabase CLI on Windows

Write-Host "Installing Supabase CLI..." -ForegroundColor Green

# npm installation is no longer supported as of August 2025
Write-Host "Using the official PowerShell installer..." -ForegroundColor Cyan

try {
    # Use the official Supabase installer
    iwr -useb https://get.supabase.com/install.ps1 | iex
} catch {
    Write-Host "PowerShell installer failed. Trying direct download..." -ForegroundColor Yellow
    
    # Create directory for Supabase CLI
    $supabasePath = "$env:USERPROFILE\AppData\Local\supabase\bin"
    if (-not (Test-Path $supabasePath)) {
        New-Item -ItemType Directory -Path $supabasePath -Force | Out-Null
    }
    
    # Download the latest release
    $releaseUrl = "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.exe"
    $outputFile = "$supabasePath\supabase.exe"
    
    Write-Host "Downloading Supabase CLI to $outputFile..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $releaseUrl -OutFile $outputFile
    
    # Add to PATH if not already there
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$supabasePath*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$supabasePath", "User")
        Write-Host "Added Supabase to your PATH" -ForegroundColor Green
    }
    
    Write-Host "You'll need to restart your PowerShell session for the PATH changes to take effect." -ForegroundColor Yellow
}

# Check if installation was successful
$supabaseInstalled = $null -ne (Get-Command supabase -ErrorAction SilentlyContinue)

if ($supabaseInstalled) {
    Write-Host "`nSuccessfully installed Supabase CLI!" -ForegroundColor Green
    supabase --version
    
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Run 'supabase login' to authenticate" -ForegroundColor White
    Write-Host "2. Run the deployment script: .\deploy-edge-functions-with-service-role.ps1" -ForegroundColor White
} else {
    Write-Host "`nFailed to install Supabase CLI automatically." -ForegroundColor Red
    Write-Host "Please visit https://supabase.com/docs/guides/cli for manual installation instructions." -ForegroundColor Yellow
}
