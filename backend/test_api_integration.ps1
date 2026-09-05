$ErrorActionPreference = 'Stop'
try {
    $loginBody = @{ username = 'admin'; password = 'password123' } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
    Write-Host "[PASS] 1. Auth Login: Role = $($loginRes.role), Scope = $($loginRes.scope_id)"
    $token = $loginRes.access_token
    $headers = @{ Authorization = "Bearer $token" }

    $me = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/auth/me' -Headers $headers
    Write-Host "[PASS] 2. Current User: Username = $($me.username), Role = $($me.role)"

    $nat = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/national/overview' -Headers $headers
    Write-Host "[PASS] 3. National Overview: Total PHCs = $($nat.total_phcs), States = $($nat.states.Count), Critical Deficit States = $($nat.critical_deficit_states_count)"

    $state = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/states/INBR/overview' -Headers $headers
    Write-Host "[PASS] 4. State Overview (Bihar): Name = $($state.state_name), Total Districts = $($state.districts.Count)"
    Write-Host "Districts: " ($state.districts | ForEach-Object { "$($_.district_id): $($_.district_name)" } | Out-String)

    $distId = $state.districts[0].district_id
    $phcs = Invoke-RestMethod -Uri "http://127.0.0.1:8000/districts/$distId/phcs" -Headers $headers
    Write-Host "[PASS] 5. District PHCs ($distId): Total PHCs = $($phcs.phcs.Count), First = $($phcs.phcs[0].name)"

    $alerts = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/alerts' -Headers $headers
    Write-Host "[PASS] 6. Alerts Feed: Total Active Alerts = $($alerts.Count), Top Alert = $($alerts[0].title)"

    $recs = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/redistribution/recommendations?status=pending' -Headers $headers
    Write-Host "[PASS] 7. Recommendations: Total Pending = $($recs.Count), ID = $($recs[0].id), Qty = $($recs[0].quantity)"

    $trans = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/transfers' -Headers $headers
    Write-Host "[PASS] 8. Transfers: Active Transfers = $($trans.Count), First Status = $($trans[0].status)"
    
    Write-Host "ALL 8 API VALIDATION CHECKS PASSED!"
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
