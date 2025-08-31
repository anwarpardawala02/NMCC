#!/usr/bin/env pwsh
# Test script to call the save-scoresheet-data function directly

Write-Host "Testing save-scoresheet-data function..." -ForegroundColor Cyan

# Test data
$testData = @{
    parsedData = @{
        match = @{
            opponent = "Test Team"
            date = "2025-08-31"
            result = "Won"
        }
        players = @(
            @{
                name = "Test Player"
                runs = 50
                balls = 30
                dismissal = "Not out"
                isNMCC = $true
            }
        )
        opponentPlayers = @(
            @{
                name = "Opponent Player"
                runs = 25
                balls = 40
                dismissal = "Bowled"
                isNMCC = $false
            }
        )
    }
    filePath = "test/scoresheet.pdf"
    userId = "test-user-id"
} | ConvertTo-Json -Depth 10

Write-Host "Test data prepared..." -ForegroundColor Yellow

# You would need to get a valid JWT token from your app
# For now, let's just show how to call it
Write-Host "`nTo test the function, you need to:" -ForegroundColor White
Write-Host "1. Open your app at http://localhost:5174/" -ForegroundColor White
Write-Host "2. Log in as a fixture manager" -ForegroundColor White
Write-Host "3. Go to Admin → Scoresheets" -ForegroundColor White
Write-Host "4. Upload a scoresheet" -ForegroundColor White
Write-Host "5. Check the Supabase dashboard logs after upload" -ForegroundColor White

Write-Host "`nThe function will generate logs when called from your frontend." -ForegroundColor Green
