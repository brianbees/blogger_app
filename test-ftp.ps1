# Quick FTP Connection Test
Write-Host "🧪 Testing FTP Connection..." -ForegroundColor Cyan
Write-Host ""

# Load credentials
if (-not (Test-Path ".env.deploy")) {
    Write-Host "❌ .env.deploy not found!" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content ".env.deploy" | Where-Object { $_ -match '=' -and $_ -notmatch '^#' }
$config = @{}
foreach ($line in $envContent) {
    $key, $value = $line -split '=', 2
    $config[$key.Trim()] = $value.Trim()
}

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Host: $($config['FTP_HOST'])" -ForegroundColor Gray
Write-Host "   User: $($config['FTP_USER'])" -ForegroundColor Gray
Write-Host "   Path: $($config['FTP_PATH'])" -ForegroundColor Gray
Write-Host ""

# Test file upload
$testFile = "test-ftp-connection.txt"
$ftpPort = if ($config.ContainsKey('FTP_PORT')) { $config['FTP_PORT'] } else { '21' }
$ftpUri = "ftp://$($config['FTP_HOST']):$ftpPort$($config['FTP_PATH'])$testFile"

Write-Host "📤 Uploading $testFile..." -ForegroundColor Yellow
Write-Host "   To: $ftpUri" -ForegroundColor Gray
Write-Host ""

try {
    $ftpRequest = [System.Net.FtpWebRequest]::Create($ftpUri)
    $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($config['FTP_USER'], $config['FTP_PASS'])
    $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $ftpRequest.UseBinary = $true
    $ftpRequest.KeepAlive = $false
    
    $fileContent = [System.IO.File]::ReadAllBytes($testFile)
    $ftpRequest.ContentLength = $fileContent.Length
    
    $requestStream = $ftpRequest.GetRequestStream()
    $requestStream.Write($fileContent, 0, $fileContent.Length)
    $requestStream.Close()
    
    $response = $ftpRequest.GetResponse()
    $statusDescription = $response.StatusDescription
    $response.Close()
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Response: $statusDescription" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎉 FTP connection is working!" -ForegroundColor Green
    Write-Host "   Check your server for: $($config['FTP_PATH'])$testFile" -ForegroundColor White
    Write-Host ""
    Write-Host "   Ready to deploy? Run: .\deploy.ps1" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Common Issues:" -ForegroundColor Yellow
    Write-Host "   • Wrong FTP hostname (should be like ftp.yourdomain.com)" -ForegroundColor Gray
    Write-Host "   • Wrong username (usually username@domain.com)" -ForegroundColor Gray
    Write-Host "   • Wrong password" -ForegroundColor Gray
    Write-Host "   • Wrong path (try / or /public_html/)" -ForegroundColor Gray
    Write-Host "   • Firewall blocking FTP (port 21)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Double-check your .env.deploy file and try again" -ForegroundColor White
}
