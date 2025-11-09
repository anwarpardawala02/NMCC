#!/usr/bin/env pwsh

# This script queries Supabase to check if player statistics exist
# It reads Supabase credentials from environment variables or .env file

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\check-statistics-data.ps1"
    Write-Host ""
    Write-Host "This script checks if player statistics exist in the database."
    Write-Host "It requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables."
    exit 0
}

# Load .env file if it exists
$envFile = ".\.env"
if (Test-Path $envFile) {
    Write-Host "Loading environment from .env file..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove quotes if present
            $value = $value -replace '^["'']|["'']$'
            [Environment]::SetEnvironmentVariable($key, $value)
        }
    }
}

# Get Supabase credentials from environment
$supabaseUrl = $env:VITE_SUPABASE_URL
$supabaseKey = $env:VITE_SUPABASE_ANON_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "Error: Missing Supabase credentials" -ForegroundColor Red
    Write-Host "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables" -ForegroundColor Yellow
    exit 1
}

Write-Host "Connected to Supabase at: $supabaseUrl" -ForegroundColor Green

# Query players table
Write-Host "`n=== CHECKING PLAYERS TABLE ===" -ForegroundColor Cyan
$playersUrl = "$supabaseUrl/rest/v1/players?select=id,full_name,active&limit=100"
$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
}

try {
    $players = Invoke-RestMethod -Uri $playersUrl -Headers $headers -Method Get
    Write-Host "Found $($players.Count) players" -ForegroundColor Green
    if ($players.Count -gt 0) {
        Write-Host "`nFirst 10 players:"
        $players | Select-Object -First 10 | Format-Table -Property id, full_name, active
    }
} catch {
    Write-Host "Error querying players: $_" -ForegroundColor Red
}

# Query player_statistics table
Write-Host "`n=== CHECKING PLAYER_STATISTICS TABLE ===" -ForegroundColor Cyan
$statsUrl = "$supabaseUrl/rest/v1/player_statistics?select=*&limit=100"

try {
    $stats = Invoke-RestMethod -Uri $statsUrl -Headers $headers -Method Get
    Write-Host "Found $($stats.Count) statistics records" -ForegroundColor Green
    
    if ($stats.Count -eq 0) {
        Write-Host "WARNING: No statistics records found!" -ForegroundColor Yellow
    } else {
        # Group by season
        $bySeason = $stats | Group-Object -Property season
        Write-Host "`nStatistics by season:"
        foreach ($season in $byseason) {
            Write-Host "  Season $($season.Name): $($season.Count) records"
        }
        
        Write-Host "`nFirst 10 statistics records:"
        $stats | Select-Object -First 10 | Format-Table -Property player_id, player_name, season, runs, wickets, total_catches
        
        # Check for players with non-zero stats
        $nonZero = $stats | Where-Object { $_.runs -gt 0 -or $_.wickets -gt 0 -or $_.total_catches -gt 0 }
        Write-Host "`nRecords with non-zero stats: $($nonZero.Count)" -ForegroundColor Green
    }
} catch {
    Write-Host "Error querying statistics: $_" -ForegroundColor Red
}

# Check match_details table
Write-Host "`n=== CHECKING MATCH_DETAILS TABLE ===" -ForegroundColor Cyan
$matchUrl = "$supabaseUrl/rest/v1/match_details?select=id,player_id,player_name,date,batting_runs,bowling_wickets&limit=50"

try {
    $matches = Invoke-RestMethod -Uri $matchUrl -Headers $headers -Method Get
    Write-Host "Found $($matches.Count) match detail records" -ForegroundColor Green
    
    if ($matches.Count -gt 0) {
        Write-Host "`nFirst 10 match details:"
        $matches | Select-Object -First 10 | Format-Table -Property id, player_id, player_name, date, batting_runs, bowling_wickets
    }
} catch {
    Write-Host "Error querying match_details: $_" -ForegroundColor Red
}

# Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Magenta
if ($stats.Count -eq 0) {
    Write-Host "❌ Problem: player_statistics table is empty" -ForegroundColor Red
    Write-Host "   Solution: Process scoresheets or manually create statistics records"
} elseif ($nonZero.Count -eq 0) {
    Write-Host "❌ Problem: All statistics records have zero values" -ForegroundColor Red
    Write-Host "   Solution: Re-process scoresheets or check statistics calculation logic"
} else {
    Write-Host "✅ Statistics records found with non-zero values" -ForegroundColor Green
    Write-Host "   If still showing zeros in UI, issue is likely in the Squad component or ID matching"
}

if ($matches.Count -eq 0) {
    Write-Host "⚠️  Warning: No match details found (scoresheets may not have been processed)" -ForegroundColor Yellow
}