# Edge Function Testing Script
# This script sends a test request to your Supabase Edge Function

# Configuration
$projectId = "zrhaeyktmyboeszpaqbo"
$functionName = "send-reset-email"
$email = "anwar121317@gmail.com" # Using the Resend registered email
$token = "test-token-$(Get-Random)"

# We're now using the invoke key approach for non-JWT verified functions
# When functions are deployed with --no-verify-jwt, we need to pass Authorization: Bearer SUPABASE_ANON_KEY
# And we need to add a header for the Function Access Key

# The anon key from Project Settings > API
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyaGFleWt0bXlib2VzenBhcWJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2MzI3NDYsImV4cCI6MjA0MTIwODc0Nn0.VzNFXKDZOmtBZxOSvIKnXZAu_Pf6rbnMFQcys8WzokI"

# Build the request
$uri = "https://$projectId.supabase.co/functions/v1/$functionName"
$body = @{
    email = $email
    token = $token
} | ConvertTo-Json

# Headers that should work with --no-verify-jwt deployment
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $anonKey"
}

Write-Host "Sending test request to Edge Function..."
Write-Host "URL: $uri"
Write-Host "Body: $body"
Write-Host "-----------------------------------"

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 10)"
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.Value__)"
    
    # Try to get response body from error
    try {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorResponse = $reader.ReadToEnd()
        Write-Host "Error Response: $errorResponse"
    } catch {
        Write-Host "Could not get error details: $_"
    }
    
    Write-Host "Exception: $_"
}
