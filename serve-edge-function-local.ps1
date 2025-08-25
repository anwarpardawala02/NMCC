# Local testing script for Edge Function
# This script sets up the function locally using the Supabase CLI

# Check if Supabase CLI is available
try {
    $supabaseCLIVersion = npx supabase --version 2>&1
    Write-Host "Using Supabase CLI: $supabaseCLIVersion"
} catch {
    Write-Host "Error: Supabase CLI not found or not working properly" -ForegroundColor Red
    Write-Host "Please install it with: npm install -g supabase"
    exit 1
}

# Set environment variables for local testing
$env:RESEND_API_KEY = "re_WXVNmEdT_JGVRdntn4uZaYDpCAYJbRWj9"

# Start the Edge Function locally
Write-Host "Starting send-reset-email function locally..." -ForegroundColor Cyan
Write-Host "You can test the function with a POST request to http://localhost:54321/functions/v1/send-reset-email"
Write-Host "Press Ctrl+C to stop the function"
Write-Host "-------------------------------------------------"

npx supabase functions serve send-reset-email --no-verify-jwt
