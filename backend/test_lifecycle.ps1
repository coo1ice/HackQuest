$ErrorActionPreference = 'Stop'
try {
    $loginBody = @{ username = 'admin'; password = 'password123' } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
    $headers = @{ Authorization = "Bearer $($loginRes.access_token)" }

    $recs = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/redistribution/recommendations?status=pending' -Headers $headers
    if ($recs.Count -eq 0) {
        Write-Host "No pending recommendations found."
        exit 0
    }
    $recId = $recs[0].id

    $approveBody = @{ notes = 'Approved under NDMA mandate by Dr. S. K. Roy' } | ConvertTo-Json
    $transfer = Invoke-RestMethod -Uri "http://127.0.0.1:8000/redistribution/recommendations/$recId/approve" -Method Post -Body $approveBody -ContentType 'application/json' -Headers $headers
    Write-Host "[PASS] Recommendation $recId Approved -> Transfer ID: $($transfer.id), Status: $($transfer.status)"

    $dispatchBody = @{ status = 'dispatched'; notes = 'Consignment dispatched via refrigerated van' } | ConvertTo-Json
    $dispatched = Invoke-RestMethod -Uri "http://127.0.0.1:8000/transfers/$($transfer.id)/status" -Method Patch -Body $dispatchBody -ContentType 'application/json' -Headers $headers
    Write-Host "[PASS] Transfer Dispatched -> Status: $($dispatched.status)"

    $receivedBody = @{ status = 'received'; notes = 'Received and stock counted at recipient facility' } | ConvertTo-Json
    $received = Invoke-RestMethod -Uri "http://127.0.0.1:8000/transfers/$($transfer.id)/status" -Method Patch -Body $receivedBody -ContentType 'application/json' -Headers $headers
    Write-Host "[PASS] Transfer Received -> Status: $($received.status)"

    $outcomeBody = @{
        transfer_id = $transfer.id
        actual_lead_time_hours = 2.8
        phc_stockout_prevented = $true
        wastage_units_prevented = 50.0
        notes = 'Zero stockout incidents reported post-replenishment'
    } | ConvertTo-Json
    $outcome = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/outcomes/log' -Method Post -Body $outcomeBody -ContentType 'application/json' -Headers $headers
    Write-Host "[PASS] Outcome Logged -> ID: $($outcome.id), Stockout Prevented: $($outcome.phc_stockout_prevented)"

    Write-Host "COMPLETE END-TO-END LIFECYCLE VERIFIED!"
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
