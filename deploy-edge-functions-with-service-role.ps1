#!/usr/bin/env pwsh
# Script to deploy Supabase Edge Functions with Service Role Key

# Get the directory of the current script
$scriptDir = $PSScriptRoot

 # Check if SERVICE_ROLE_KEY is set in environment
if (-not $env:SERVICE_ROLE_KEY) {
    Write-Host "ERROR: SERVICE_ROLE_KEY environment variable is not set."
    Write-Host "Please set this environment variable with your service role key."
    Write-Host "You can get this from your Supabase dashboard under Project Settings > API."
    exit 1
}

# Deploy functions with service role key
Write-Host "Deploying edge functions with service role key..."
$functionsDir = Join-Path $scriptDir "supabase/functions"

# Loop through function directories
Get-ChildItem -Path $functionsDir -Directory | Where-Object { $_.Name -notmatch "^_" } | ForEach-Object {
    $functionName = $_.Name
    $functionPath = Join-Path $functionsDir $functionName
    
    Write-Host "Deploying $functionName function with secrets..."
    
    # Deploy the function using full path to supabase CLI
    & "C:\Users\anwar\supabase-cli\supabase.exe" functions deploy $functionName
    
    # Add the SERVICE_ROLE_KEY as a secret
    # Get the project ref from supabase config if available, otherwise use default
    $projectRef = (& "C:\Users\anwar\supabase-cli\supabase.exe" status -o json | ConvertFrom-Json).project_ref
    if (-not $projectRef) {
        Write-Host "WARNING: Could not detect project reference automatically."
        Write-Host "Enter your Supabase project reference (found in your dashboard URL):"
        $projectRef = Read-Host
    }
    
    # Set the secret for the function - using SERVICE_ROLE_KEY to avoid Supabase CLI restrictions
    & "C:\Users\anwar\supabase-cli\supabase.exe" secrets set "SERVICE_ROLE_KEY=$env:SERVICE_ROLE_KEY" --project-ref $projectRef
}

Write-Host "Deployment completed successfully!"
