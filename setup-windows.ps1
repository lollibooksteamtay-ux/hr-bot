# HR Bot - Setup Script for Windows
# Chay script nay bang: chuot phai -> Run with PowerShell

$ErrorActionPreference = "Stop"
$REPO_URL = "https://github.com/lollibooksteamtay-ux/hr-bot.git"
$TARGET_DIR = "$HOME\hr-bot"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   HR BOT - CAI DAT TU DONG" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# --- Kiem tra Git ---
Write-Host "[1/4] Kiem tra Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>&1
    Write-Host "  OK: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "  LOI: Git chua duoc cai dat." -ForegroundColor Red
    Write-Host "  Vao https://git-scm.com/download/win de cai Git truoc." -ForegroundColor Red
    Read-Host "Nhan Enter de thoat"
    exit 1
}

# --- Kiem tra Node.js ---
Write-Host "[2/4] Kiem tra Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  OK: Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  CANH BAO: Node.js chua duoc cai dat." -ForegroundColor Yellow
    Write-Host "  Vao https://nodejs.org de cai Node.js LTS, sau do chay lai script nay." -ForegroundColor Yellow
    Read-Host "Nhan Enter de thoat"
    exit 1
}

# --- Clone hoac update repo ---
Write-Host "[3/4] Lay code HR Bot..." -ForegroundColor Yellow
if (Test-Path $TARGET_DIR) {
    Write-Host "  Thu muc $TARGET_DIR da ton tai, dang cap nhat..." -ForegroundColor Yellow
    Set-Location $TARGET_DIR
    git pull origin main
    Write-Host "  OK: Da cap nhat code moi nhat." -ForegroundColor Green
} else {
    Write-Host "  Dang tai code ve $TARGET_DIR ..." -ForegroundColor Yellow
    git clone $REPO_URL $TARGET_DIR
    Set-Location $TARGET_DIR
    Write-Host "  OK: Tai code thanh cong." -ForegroundColor Green
}

# --- Cai dependencies ---
Write-Host "[4/4] Cai dat thu vien (npm install)..." -ForegroundColor Yellow
npm install --legacy-peer-deps
Write-Host "  OK: Cai dat xong." -ForegroundColor Green

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host "   CAI DAT HOAN TAT!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Buoc tiep theo:" -ForegroundColor Cyan
Write-Host "  1. Mo Claude Desktop" -ForegroundColor White
Write-Host "  2. Go lenh: cd ~/hr-bot" -ForegroundColor White
Write-Host "  3. Nhan Enter va bat dau lam viec!" -ForegroundColor White
Write-Host ""
Read-Host "Nhan Enter de dong cua so nay"
