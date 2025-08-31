#!/usr/bin/env pwsh
# Script to manually set secrets for edge functions using the Supabase dashboard

# Prompt for service role key if not set
if (-not $env:SERVICE_ROLE_KEY) {
    Write-Host "Enter your Supabase service role key:" -ForegroundColor Yellow
    $env:SERVICE_ROLE_KEY = Read-Host -AsSecureString | ConvertFrom-SecureString -AsPlainText
}

Write-Host "`nTo update your edge functions to use the service role key:" -ForegroundColor Cyan

Write-Host "`n1. Log in to your Supabase dashboard: https://app.supabase.com" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Navigate to Edge Functions in the sidebar" -ForegroundColor White
Write-Host "4. For each function (process-scoresheet and save-scoresheet-data):" -ForegroundColor White
Write-Host "   a. Click on the function name" -ForegroundColor White
Write-Host "   b. Click on the 'Secrets' tab" -ForegroundColor White
Write-Host "   c. Add a new secret:" -ForegroundColor White
Write-Host "      - Name: SERVICE_ROLE_KEY" -ForegroundColor White
Write-Host "      - Value: $env:SERVICE_ROLE_KEY" -ForegroundColor White

Write-Host "`nAlso, make sure to update the function code as described in MANUAL_EDGE_FUNCTION_UPDATE.md" -ForegroundColor Yellow

# Copy service role key to clipboard for convenience
Set-Clipboard -Value $env:SERVICE_ROLE_KEY

Write-Host "`nYour service role key has been copied to clipboard for easy pasting in the Supabase dashboard." -ForegroundColor Green
