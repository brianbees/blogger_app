# Voice Journal PWA - Automated Deployment Script
# Builds the project and deploys via FTP to your web server

param(
    [switch]$SkipBuild,
    [switch]$DryRun
)

Write-Host "🚀 Voice Journal PWA Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# --- Auto-bump patch version in package.json ---
Write-Host "🔢 Bumping version..." -ForegroundColor Yellow
$pkgContent = Get-Content "package.json" -Raw
if ($pkgContent -match '"version":\s*"(\d+)\.(\d+)\.(\d+)"') {
    $major = $matches[1]; $minor = $matches[2]; $patch = [int]$matches[3] + 1
    $newVersion = "$major.$minor.$patch"
    $pkgContent = $pkgContent -replace '"version":\s*"\d+\.\d+\.\d+"', "\"version\": \"$newVersion\""
    Set-Content "package.json" $pkgContent -NoNewline
    Write-Host "✅ Version bumped to v$newVersion" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not parse version from package.json, continuing without bump" -ForegroundColor Yellow
    $newVersion = "unknown"
}
Write-Host ""

# --- Commit and push version bump to git ---
Write-Host "📤 Pushing version bump to GitHub..." -ForegroundColor Yellow
git add package.json
git commit -m "Bump version to v$newVersion"
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Git push failed (continuing with deploy)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Pushed to GitHub" -ForegroundColor Green
}
Write-Host ""

# Check if .env.deploy exists
if (-not (Test-Path ".env.deploy")) {
    Write-Host "❌ Error: .env.deploy file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create .env.deploy with your FTP credentials:" -ForegroundColor Yellow
    Write-Host "1. Copy .env.deploy.example to .env.deploy" -ForegroundColor White
    Write-Host "2. Edit .env.deploy with your actual FTP details from cPanel" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Load FTP credentials from .env.deploy
Write-Host "📋 Loading deployment configuration..." -ForegroundColor Yellow
$envContent = Get-Content ".env.deploy" | Where-Object { $_ -match '=' -and $_ -notmatch '^#' }
$config = @{}
foreach ($line in $envContent) {
    $key, $value = $line -split '=', 2
    $config[$key.Trim()] = $value.Trim()
}

# Validate required credentials
$required = @('FTP_HOST', 'FTP_USER', 'FTP_PASS', 'FTP_PATH')
$missing = $required | Where-Object { -not $config.ContainsKey($_) -or $config[$_] -eq '' }
if ($missing) {
    Write-Host "❌ Missing required configuration: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "Please update your .env.deploy file" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Configuration loaded" -ForegroundColor Green
Write-Host "   Host: $($config['FTP_HOST'])" -ForegroundColor Gray
Write-Host "   User: $($config['FTP_USER'])" -ForegroundColor Gray
Write-Host "   Path: $($config['FTP_PATH'])" -ForegroundColor Gray
Write-Host ""

# Build the project
if (-not $SkipBuild) {
    Write-Host "🔨 Building production bundle..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build complete" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping build (using existing dist/ folder)" -ForegroundColor Yellow
    Write-Host ""
}

# Check if dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "❌ dist/ folder not found. Run build first or remove -SkipBuild flag." -ForegroundColor Red
    exit 1
}

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No files will be uploaded" -ForegroundColor Magenta
    Write-Host ""
}

# Get list of files to upload
Write-Host "📦 Preparing files for upload..." -ForegroundColor Yellow
$files = Get-ChildItem -Path "dist" -Recurse -File
Write-Host "   Found $($files.Count) files to upload" -ForegroundColor Gray
Write-Host ""

# FTP Upload using .NET WebClient
Write-Host "📤 Uploading to server..." -ForegroundColor Yellow

$ftpPort = if ($config.ContainsKey('FTP_PORT')) { $config['FTP_PORT'] } else { '21' }
$uploadCount = 0
$errorCount = 0

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring((Get-Item "dist").FullName.Length + 1).Replace('\', '/')
    $ftpUri = "ftp://$($config['FTP_HOST']):$ftpPort$($config['FTP_PATH'])$relativePath"
    
    try {
        if (-not $DryRun) {
            # Create directory structure if needed
            $dirPath = Split-Path $relativePath -Parent
            if ($dirPath) {
                $ftpDirUri = "ftp://$($config['FTP_HOST']):$ftpPort$($config['FTP_PATH'])$($dirPath.Replace('\', '/'))"
                # Try to create directory (will fail silently if exists)
                try {
                    $ftpRequest = [System.Net.FtpWebRequest]::Create($ftpDirUri)
                    $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($config['FTP_USER'], $config['FTP_PASS'])
                    $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
                    $ftpRequest.GetResponse() | Out-Null
                } catch {
                    # Directory might already exist, ignore error
                }
            }
            
            # Upload file
            $ftpRequest = [System.Net.FtpWebRequest]::Create($ftpUri)
            $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($config['FTP_USER'], $config['FTP_PASS'])
            $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            $ftpRequest.UseBinary = $true
            $ftpRequest.KeepAlive = $false
            
            $fileContent = [System.IO.File]::ReadAllBytes($file.FullName)
            $ftpRequest.ContentLength = $fileContent.Length
            
            $requestStream = $ftpRequest.GetRequestStream()
            $requestStream.Write($fileContent, 0, $fileContent.Length)
            $requestStream.Close()
            
            $response = $ftpRequest.GetResponse()
            $response.Close()
        }
        
        Write-Host "   ✓ $relativePath" -ForegroundColor Green
        $uploadCount++
    } catch {
        Write-Host "   ✗ $relativePath - $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "🔍 DRY RUN COMPLETE" -ForegroundColor Magenta
    Write-Host "   $uploadCount files would be uploaded" -ForegroundColor Gray
} else {
    Write-Host "✨ DEPLOYMENT COMPLETE" -ForegroundColor Green
    Write-Host "   $uploadCount files uploaded successfully" -ForegroundColor Gray
    if ($errorCount -gt 0) {
        Write-Host "   $errorCount files failed" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "🌐 Your site should now be live at:" -ForegroundColor Cyan
    Write-Host "   https://brianmccallum.co.uk" -ForegroundColor White
}
Write-Host "================================" -ForegroundColor Cyan
