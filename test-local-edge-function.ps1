# Local Edge Function Testing Script
# This script sends a test request to your locally running Edge Function

# Configuration
$email = "anwar.pardawala@gmail.com" 
$token = "test-token-$(Get-Random)"

# Build the request
$uri = "http://localhost:54321/functions/v1/send-reset-email"
$body = @{
    email = $email
    token = $token
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Sending test request to local Edge Function..."
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
