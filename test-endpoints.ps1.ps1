$Urls = @(
    "https://www.bnlvconsulting.com",
    "https://bnlvconsulting.com",
    "https://bms.bnlvconsulting.com",
    "https://nidhivan.bnlvconsulting.com",
    "https://limsy.bnlvconsulting.com",
    "https://vihang.bnlvconsulting.com",
    "https://unknown.bnlvconsulting.com"
)

$Results = @()

foreach ($Url in $Urls) {
    try {
        # Use -Method Head to fetch only headers and status codes, saving bandwidth
        $Response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing
        
        $Results += [PSCustomObject]@{
            TargetURL  = $Url
            StatusCode = $Response.StatusCode
            Server     = $Response.Headers["Server"]
            RedirectLocation = $Response.Headers["Location"]
        }
    } catch {
        # Capture intended 404s or connection failures
        $Results += [PSCustomObject]@{
            TargetURL  = $Url
            StatusCode = $_.Exception.Response.StatusCode.value__
            Server     = "N/A"
            RedirectLocation = "N/A"
        }
    }
}

# Display results in the terminal
$Results | Format-Table -AutoSize

# Export the diagnostic matrix to a CSV file for your records
$Results | Export-Csv -Path ".\BNLV_Deployment_Diagnostics.csv" -NoTypeInformation
Write-Host "Diagnostics saved to BNLV_Deployment_Diagnostics.csv" -ForegroundColor Green