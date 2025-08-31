#!/usr/bin/env pwsh
# Test script to verify service role key is working correctly

Write-Host "Testing service role key functionality..." -ForegroundColor Cyan

# Check if SERVICE_ROLE_KEY is set
if (-not $env:SERVICE_ROLE_KEY) {
    Write-Host "ERROR: SERVICE_ROLE_KEY environment variable is not set." -ForegroundColor Red
    exit 1
}

Write-Host "✅ SERVICE_ROLE_KEY is set" -ForegroundColor Green

# Test the secrets in Supabase
Write-Host "`nChecking secrets in Supabase..." -ForegroundColor Yellow
& "C:\Users\anwar\supabase-cli\supabase.exe" secrets list --project-ref zrhaeyktmyboeszpaqbo

Write-Host "`nIf SERVICE_ROLE_KEY appears in the list above, the secret is set correctly." -ForegroundColor Cyan
Write-Host "If you still get 403 errors, the issue might be with RLS policies or the edge function code." -ForegroundColor Yellow

Write-Host "`nNext steps:" -ForegroundColor White
Write-Host "1. Check the Supabase dashboard for edge function logs" -ForegroundColor White
Write-Host "2. Verify RLS policies allow service role operations" -ForegroundColor White
Write-Host "3. Test with a simple edge function that just returns data" -ForegroundColor White
