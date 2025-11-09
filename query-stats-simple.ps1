#!/usr/bin/env pwsh

# Simple query to check player_statistics data

# Load .env file
$envFile = ".\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $value = $value -replace '^["'']|["'']$'
            [Environment]::SetEnvironmentVariable($key, $value)
        }
    }
}

$url = $env:VITE_SUPABASE_URL
$key = $env:VITE_SUPABASE_ANON_KEY

# Try to use service role key if available (bypasses RLS)
if ($env:SUPABASE_SERVICE_ROLE_KEY) {
    $key = $env:SUPABASE_SERVICE_ROLE_KEY
    Write-Host "Using SERVICE_ROLE_KEY" -ForegroundColor Cyan
} else {
    Write-Host "Using ANON_KEY (may have RLS restrictions)" -ForegroundColor Yellow
}

if (-not $url -or -not $key) {
    Write-Host "Error: Missing Supabase credentials in .env file"
    exit 1
}

$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
}

# Query player_statistics with no limit
Write-Host "Querying player_statistics table..."
$statsUrl = "$url/rest/v1/player_statistics?select=id,player_id,player_name,season,runs,wickets,total_catches,games&limit=1000"
$stats = Invoke-RestMethod -Uri $statsUrl -Headers $headers -Method Get

Write-Host "Total records: $($stats.Count)" -ForegroundColor Cyan

if ($stats.Count -gt 0) {
    Write-Host "`nAll records:"
    $stats | Format-Table -Property player_id, player_name, season, runs, wickets, total_catches, games -AutoSize
    
    # Check for non-zero stats
    $nonZero = $stats | Where-Object { $_.runs -gt 0 -or $_.wickets -gt 0 -or $_.total_catches -gt 0 }
    Write-Host "`nRecords with non-zero values: $($nonZero.Count)" -ForegroundColor Green
    
    # Check for all-zero stats
    $allZero = $stats | Where-Object { $_.runs -eq 0 -and $_.wickets -eq 0 -and $_.total_catches -eq 0 }
    if ($allZero.Count -gt 0) {
        Write-Host "Records with ALL zero values: $($allZero.Count)" -ForegroundColor Yellow
        Write-Host "Sample zero records:"
        $allZero | Select-Object -First 5 | Format-Table -Property player_id, player_name, runs, wickets, total_catches
    }
} else {
    Write-Host "No records found in player_statistics table" -ForegroundColor Red
}
