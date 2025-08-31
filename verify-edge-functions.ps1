#!/usr/bin/env pwsh
# Script to verify Supabase Edge Functions configuration

# Get project reference
$projectRef = (supabase status -o json | ConvertFrom-Json).project_ref
if (-not $projectRef) {
    Write-Host "Could not detect project reference automatically."
    Write-Host "Enter your Supabase project reference (found in your dashboard URL):"
    $projectRef = Read-Host
}

# Check function deployments
Write-Host "`n=== Deployed Functions ===" -ForegroundColor Cyan
supabase functions list

# Check secrets
Write-Host "`n=== Function Secrets ===" -ForegroundColor Cyan
$secrets = supabase secrets list --project-ref $projectRef

if ($secrets -match "SUPABASE_SERVICE_ROLE_KEY") {
    Write-Host "✅ SUPABASE_SERVICE_ROLE_KEY is correctly set." -ForegroundColor Green
} else {
    Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY is NOT set. Please deploy with service role key." -ForegroundColor Red
}

# Check if functions are accessible
Write-Host "`n=== Testing Function Access ===" -ForegroundColor Cyan
Write-Host "Attempting to access process-scoresheet function..."
$testResult = supabase functions serve process-scoresheet --no-verify-jwt 2>&1 | Select-String -Pattern "Serving at" -SimpleMatch
if ($testResult) {
    Write-Host "✅ Function server started successfully." -ForegroundColor Green
} else {
    Write-Host "❌ Could not start function server. Check permissions." -ForegroundColor Red
}

Write-Host "`nVerification complete. Check the output above for any issues."
