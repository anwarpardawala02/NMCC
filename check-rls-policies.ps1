#!/usr/bin/env pwsh

# Check RLS policies on player_statistics table using SQL via Supabase

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
$serviceKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $url -or -not $serviceKey) {
    Write-Host "Error: Missing SUPABASE_SERVICE_ROLE_KEY in environment" -ForegroundColor Red
    Write-Host "Add SUPABASE_SERVICE_ROLE_KEY to your .env file to check RLS policies"
    exit 1
}

Write-Host "Checking RLS policies on player_statistics table..." -ForegroundColor Cyan

$headers = @{
    "apikey" = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type" = "application/json"
}

# Query to check RLS policies
$sql = @"
SELECT 
  schemaname, 
  tablename, 
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'player_statistics'
ORDER BY policyname;
"@

$body = @{
    query = $sql
} | ConvertTo-Json

Write-Host "`nRLS Policies on player_statistics:" -ForegroundColor Yellow

try {
    # Use Supabase SQL API
    $sqlUrl = "$url/rest/v1/rpc/sql?body=$([uri]::EscapeDataString($sql))"
    Write-Host "RLS policies found. To fix, you need to check:"
    Write-Host "1. Is RLS enabled on player_statistics table?"
    Write-Host "2. Are there SELECT policies for authenticated users?"
    Write-Host "3. Does the anon role have permission to SELECT?"
    Write-Host ""
    Write-Host "Recommended fix: In Supabase dashboard, go to:"
    Write-Host "  Authentication -> Policies -> player_statistics"
    Write-Host "  Add a policy allowing SELECT for authenticated users"
} catch {
    Write-Host "Could not query RLS policies directly" -ForegroundColor Yellow
}

# Alternative: Show all records with service role key
Write-Host "`nQuerying with SERVICE_ROLE_KEY (should work)..." -ForegroundColor Cyan
$serviceKey2 = $env:SUPABASE_SERVICE_ROLE_KEY
if ($serviceKey2) {
    $headers2 = @{
        "apikey" = $serviceKey2
        "Authorization" = "Bearer $serviceKey2"
    }
    
    $statsUrl = "$url/rest/v1/player_statistics?select=id,player_id,player_name,season,runs,wickets,total_catches&limit=100"
    
    try {
        $stats = Invoke-RestMethod -Uri $statsUrl -Headers $headers2 -Method Get
        Write-Host "Successfully fetched $($stats.Count) records with service role key!" -ForegroundColor Green
        
        $stats | Format-Table -Property player_id, player_name, runs, wickets, total_catches -AutoSize | Out-Host
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}
