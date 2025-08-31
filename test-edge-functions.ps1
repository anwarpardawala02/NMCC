#!/usr/bin/env pwsh
# Script to test if edge functions are working without Supabase CLI

# Function to test if a URL is accessible
function Test-Url {
    param (
        [string]$Url
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

Write-Host "Testing edge functions accessibility..." -ForegroundColor Cyan

# Prompt for project reference
Write-Host "Enter your Supabase project reference (found in your dashboard URL):" -ForegroundColor Yellow
$projectRef = Read-Host

# Test process-scoresheet function
$processUrl = "https://$projectRef.supabase.co/functions/v1/process-scoresheet"
$processAccessible = Test-Url -Url $processUrl

# Test save-scoresheet-data function
$saveUrl = "https://$projectRef.supabase.co/functions/v1/save-scoresheet-data"
$saveAccessible = Test-Url -Url $saveUrl

if ($processAccessible) {
    Write-Host "✅ process-scoresheet function is accessible." -ForegroundColor Green
} else {
    Write-Host "❌ process-scoresheet function is not accessible." -ForegroundColor Red
}

if ($saveAccessible) {
    Write-Host "✅ save-scoresheet-data function is accessible." -ForegroundColor Green
} else {
    Write-Host "❌ save-scoresheet-data function is not accessible." -ForegroundColor Red
}

# Overall guidance
Write-Host "`nIf your functions are accessible:" -ForegroundColor Cyan
Write-Host "1. Visit the Supabase dashboard: https://app.supabase.com"
Write-Host "2. Go to Edge Functions and manually update the code as described in MANUAL_EDGE_FUNCTION_UPDATE.md"
Write-Host "3. Add the SUPABASE_SERVICE_ROLE_KEY secret through the dashboard"

Write-Host "`nIf your functions are not accessible:" -ForegroundColor Cyan
Write-Host "1. Make sure you've deployed your functions to Supabase"
Write-Host "2. Check your Supabase project reference is correct"
Write-Host "3. Visit the Supabase dashboard to verify function deployment status"
