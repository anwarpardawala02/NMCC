#!/usr/bin/env pwsh
# Script to manually set secrets for edge functions using the Supabase CLI

# Prompt for service role key if not set
if (-not $env:SERVICE_ROLE_KEY) {
    Write-Host "Enter your Supabase service role key:" -ForegroundColor Yellow
    $env:SERVICE_ROLE_KEY = Read-Host -AsSecureString | ConvertFrom-SecureString -AsPlainText
}

$projectRef = "zrhaeyktmyboeszpaqbo"  # Replace with your project reference

Write-Host "`nAttempting to set the SERVICE_ROLE_KEY secret for all functions..." -ForegroundColor Cyan

# Loop through each function
$functions = @("process-scoresheet", "save-scoresheet-data", "send-reset-email")
foreach ($function in $functions) {
    Write-Host "Setting secret for $function..." -ForegroundColor White
    & "C:\Users\anwar\supabase-cli\supabase.exe" secrets set --project-ref $projectRef --env-file <(echo "SERVICE_ROLE_KEY=$($env:SERVICE_ROLE_KEY)")
}

Write-Host "`nAlternatively, manually set the secrets through the dashboard:" -ForegroundColor Yellow
Write-Host "1. Go to https://supabase.com/dashboard/project/$projectRef/functions" -ForegroundColor White
Write-Host "2. Click on each function" -ForegroundColor White
Write-Host "3. Navigate to 'Settings' > 'Environment variables'" -ForegroundColor White
Write-Host "4. Add a new variable:" -ForegroundColor White
Write-Host "   - Key: SERVICE_ROLE_KEY" -ForegroundColor White
Write-Host "   - Value: $env:SERVICE_ROLE_KEY" -ForegroundColor White
Write-Host "5. Click 'Save'" -ForegroundColor White

# Copy service role key to clipboard for convenience
Set-Clipboard -Value $env:SERVICE_ROLE_KEY

Write-Host "`nYour service role key has been copied to clipboard for easy pasting in the Supabase dashboard." -ForegroundColor Green
Write-Host "`nAfter setting the secrets, try uploading a scoresheet again." -ForegroundColor Cyan
