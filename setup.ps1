Write-Host "BugSpotter Demo System Setup" -ForegroundColor Cyan
Write-Host ""

if (Test-Path ".env.local") {
    Write-Host "[OK] .env.local file found" -ForegroundColor Green
} else {
    Write-Host "[WARN] .env.local file not found!" -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "[OK] Created .env.local from .env.example" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: Edit .env.local and add your Upstash Redis credentials!" -ForegroundColor Red
        Write-Host "Get them from: https://console.upstash.com/" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Checking dependencies..." -ForegroundColor Cyan

if (Test-Path "node_modules") {
    Write-Host "[OK] Dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "Quick Start Guide:" -ForegroundColor Cyan
Write-Host "1. Make sure .env.local has valid Upstash Redis credentials"
Write-Host "2. Run: npm run dev"
Write-Host "3. Open: http://localhost:3000"
Write-Host "4. Create a demo session"
Write-Host "5. Try the interactive demos!"
Write-Host ""
Write-Host "Demo Sites:" -ForegroundColor Cyan
Write-Host "  - KazBank (Banking)"
Write-Host "  - TalentFlow (HR)"
Write-Host "  - QuickMart (E-commerce)"
Write-Host ""
Write-Host "Ready! Run: npm run dev" -ForegroundColor Green
