# Delete test file from FTP server
Write-Host "🗑️  Deleting test file from server..." -ForegroundColor Yellow

# Load credentials
$envContent = Get-Content ".env.deploy" | Where-Object { $_ -match '=' -and $_ -notmatch '^#' }
$config = @{}
foreach ($line in $envContent) {
    $key, $value = $line -split '=', 2
    $config[$key.Trim()] = $value.Trim()
}

$ftpPort = if ($config.ContainsKey('FTP_PORT')) { $config['FTP_PORT'] } else { '21' }
$ftpUri = "ftp://$($config['FTP_HOST']):$ftpPort$($config['FTP_PATH'])test-ftp-connection.txt"

try {
    $ftpRequest = [System.Net.FtpWebRequest]::Create($ftpUri)
    $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($config['FTP_USER'], $config['FTP_PASS'])
    $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
    
    $response = $ftpRequest.GetResponse()
    $response.Close()
    
    Write-Host "✅ Deleted: test-ftp-connection.txt" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to delete: $($_.Exception.Message)" -ForegroundColor Red
}
