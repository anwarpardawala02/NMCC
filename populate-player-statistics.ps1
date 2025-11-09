#!/usr/bin/env pwsh

# This script aggregates match_details data into player_statistics table
# It calculates totals for runs, wickets, catches, etc. for each player

param(
    [switch]$Dry,
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\populate-player-statistics.ps1 [-Dry] [-Help]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Dry   : Show what would be done without making changes"
    Write-Host "  -Help  : Show this help message"
    exit 0
}

# Load .env file
$envFile = ".\.env"
if (Test-Path $envFile) {
    Write-Host "Loading environment from .env file..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $value = $value -replace '^["'']|["'']$'
            [Environment]::SetEnvironmentVariable($key, $value)
        }
    }
}

$supabaseUrl = $env:VITE_SUPABASE_URL
$supabaseKey = $env:VITE_SUPABASE_ANON_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "Error: Missing Supabase credentials" -ForegroundColor Red
    exit 1
}

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
}

Write-Host "Fetching match details..." -ForegroundColor Cyan

# Get all match details
$matchUrl = "$supabaseUrl/rest/v1/match_details?select=*&limit=1000"
$allMatches = Invoke-RestMethod -Uri $matchUrl -Headers $headers -Method Get

Write-Host "Found $($allMatches.Count) match records" -ForegroundColor Green

# Group by player_id
$playerStats = @{}
foreach ($match in $allMatches) {
    $playerId = $match.player_id
    if (-not $playerStats[$playerId]) {
        $playerStats[$playerId] = @{
            player_id = $playerId
            player_name = $match.player_name
            season = "2025"
            games = 0
            inns = 0
            not_outs = 0
            runs = 0
            high_score = 0
            high_score_not_out = $false
            avg = 0
            fifties = 0
            hundreds = 0
            strike_rate = 0
            overs = 0
            maidens = 0
            bowling_runs = 0
            wickets = 0
            best_bowling = "0/0"
            five_wicket_haul = 0
            economy_rate = 0
            bowling_strike_rate = 0
            bowling_average = 0
            wk_catches = 0
            stumpings = 0
            total_wk_wickets = 0
            fielding_catches = 0
            run_outs = 0
            total_fielding_wickets = 0
            total_catches = 0
            total_victims = 0
        }
    }
    
    $player = $playerStats[$playerId]
    
    # Accumulate batting stats
    if ($match.batting_runs -gt 0 -or $match.batting_balls -gt 0) {
        $player.inns += 1
        $player.runs += [int]$match.batting_runs
        
        # Check if not out
        if ($match.batting_how_out -eq "Not Out" -or $match.batting_how_out -eq "not out") {
            $player.not_outs += 1
            $player.high_score_not_out = $true
        }
        
        # Update high score
        if ($match.batting_runs -gt $player.high_score) {
            $player.high_score = $match.batting_runs
        }
        
        # Check for milestone
        if ($match.batting_runs -ge 100) {
            $player.hundreds += 1
        } elseif ($match.batting_runs -ge 50) {
            $player.fifties += 1
        }
        
        # Calculate strike rate if balls available
        if ($match.batting_balls -gt 0) {
            $sr = ($match.batting_runs / $match.batting_balls) * 100
            $player.strike_rate = [math]::Round($sr, 2)
        }
    }
    
    # Accumulate bowling stats
    if ($match.bowling_wickets -gt 0 -or $match.bowling_overs -gt 0) {
        $player.overs += [int]$match.bowling_overs
        $player.maidens += [int]$match.bowling_maidens
        $player.bowling_runs += [int]$match.bowling_runs
        $player.wickets += [int]$match.bowling_wickets
        
        # Update best bowling
        if ($match.bowling_wickets -gt 0) {
            $newBowling = "$($match.bowling_wickets)/$($match.bowling_runs)"
            $currentBest = $player.best_bowling.Split('/')
            if ([int]$match.bowling_wickets -gt [int]$currentBest[0]) {
                $player.best_bowling = $newBowling
            }
        }
        
        # Check for five wicket haul
        if ($match.bowling_wickets -ge 5) {
            $player.five_wicket_haul += 1
        }
    }
    
    # Accumulate fielding stats
    if ($match.fielding_catches -gt 0) {
        $player.fielding_catches += [int]$match.fielding_catches
        $player.total_catches += [int]$match.fielding_catches
    }
    
    $player.games += 1
}

Write-Host "Aggregated stats for $($playerStats.Count) players" -ForegroundColor Green

# Calculate averages
foreach ($playerId in $playerStats.Keys) {
    $player = $playerStats[$playerId]
    
    # Calculate batting average
    if ($player.inns -gt $player.not_outs) {
        $player.avg = [math]::Round($player.runs / ($player.inns - $player.not_outs), 2)
    }
    
    # Calculate bowling stats
    if ($player.overs -gt 0) {
        $player.economy_rate = [math]::Round($player.bowling_runs / $player.overs, 2)
        
        if ($player.wickets -gt 0) {
            $player.bowling_strike_rate = [math]::Round(($player.overs * 6) / $player.wickets, 2)
            $player.bowling_average = [math]::Round($player.bowling_runs / $player.wickets, 2)
        }
    }
}

# Show preview
Write-Host "`n=== PREVIEW OF STATISTICS ===" -ForegroundColor Cyan
foreach ($playerId in $playerStats.Keys | Select-Object -First 5) {
    $player = $playerStats[$playerId]
    Write-Host "$($player.player_name): Runs=$($player.runs), Wickets=$($player.wickets), Catches=$($player.total_catches), Games=$($player.games)" -ForegroundColor Yellow
}

if ($Dry) {
    Write-Host "`n[DRY RUN] Would insert $($playerStats.Count) statistics records" -ForegroundColor Yellow
    exit 0
}

# Insert into player_statistics table
$statsUrl = "$supabaseUrl/rest/v1/player_statistics"
$insertCount = 0
$errorCount = 0

Write-Host "`nInserting statistics records..." -ForegroundColor Cyan

foreach ($playerId in $playerStats.Keys) {
    $player = $playerStats[$playerId]
    
    $body = @{
        player_id = $player.player_id
        player_name = $player.player_name
        season = $player.season
        games = $player.games
        inns = $player.inns
        not_outs = $player.not_outs
        runs = $player.runs
        high_score = $player.high_score
        high_score_not_out = $player.high_score_not_out
        avg = $player.avg
        fifties = $player.fifties
        hundreds = $player.hundreds
        strike_rate = $player.strike_rate
        overs = $player.overs
        maidens = $player.maidens
        bowling_runs = $player.bowling_runs
        wickets = $player.wickets
        best_bowling = $player.best_bowling
        five_wicket_haul = $player.five_wicket_haul
        economy_rate = $player.economy_rate
        bowling_strike_rate = $player.bowling_strike_rate
        bowling_average = $player.bowling_average
        wk_catches = 0
        stumpings = 0
        total_wk_wickets = 0
        fielding_catches = $player.fielding_catches
        run_outs = 0
        total_fielding_wickets = 0
        total_catches = $player.total_catches
        total_victims = 0
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $statsUrl -Headers $headers -Method Post -Body $body -ContentType "application/json"
        $insertCount++
        Write-Host "✓ $($player.player_name)" -ForegroundColor Green
    } catch {
        $errorCount++
        Write-Host "✗ $($player.player_name): $_" -ForegroundColor Red
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Magenta
Write-Host "Successfully inserted: $insertCount records" -ForegroundColor Green
Write-Host "Failed: $errorCount records" -ForegroundColor Red

if ($errorCount -eq 0) {
    Write-Host "`n✅ All player statistics have been populated!" -ForegroundColor Green
    Write-Host "The Squad room should now display player statistics." -ForegroundColor Green
}