# Setup script cho HR Bot — chay 1 lan duy nhat
# Chuot phai vao file nay -> "Run with PowerShell"

Write-Host "=== Cai dat HR Bot ===" -ForegroundColor Cyan

# 1. Tao thu muc .ssh neu chua co
$sshDir = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir | Out-Null
    Write-Host "Da tao thu muc .ssh" -ForegroundColor Green
}

# 2. Kiem tra SSH key
$keyPath = "$sshDir\shotsmith_vps"
if (-not (Test-Path $keyPath)) {
    Write-Host ""
    Write-Host "CHUA CO SSH KEY!" -ForegroundColor Red
    Write-Host "Lam theo buoc sau:" -ForegroundColor Yellow
    Write-Host "  1. Nhan file 'shotsmith_vps' tu anh Tay (qua Zalo)"
    Write-Host "  2. Copy file do vao thu muc nay: $sshDir"
    Write-Host "  3. Chay lai script nay"
    Write-Host ""
    Read-Host "Nhan Enter de thoat"
    exit
}

# 3. Set quyen SSH key tu dong
Write-Host "Dang set quyen SSH key..." -ForegroundColor Yellow
try {
    $acl = Get-Acl $keyPath
    $acl.SetAccessRuleProtection($true, $false)
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $env:USERNAME, "FullControl", "Allow"
    )
    $acl.SetAccessRule($rule)
    Set-Acl $keyPath $acl
    Write-Host "Quyen SSH key OK" -ForegroundColor Green
} catch {
    Write-Host "Loi set quyen: $_" -ForegroundColor Red
}

# 4. Clone repo neu chua co
$repoDir = "$env:USERPROFILE\hr-bot"
if (-not (Test-Path $repoDir)) {
    Write-Host "Dang tai code ve may..." -ForegroundColor Yellow
    git clone https://github.com/lollibooksteamtay-ux/hr-bot.git $repoDir
    Write-Host "Tai code xong!" -ForegroundColor Green
} else {
    Write-Host "Thu muc hr-bot da ton tai, bo qua clone" -ForegroundColor Gray
}

# 5. Kiem tra Git
$gitVersion = git --version 2>$null
if (-not $gitVersion) {
    Write-Host "Git chua duoc cai! Vao https://git-scm.com/download/win de cai" -ForegroundColor Red
    Read-Host "Nhan Enter de thoat"
    exit
}

Write-Host ""
Write-Host "=== CAI DAT HOAN TAT ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tiep theo:" -ForegroundColor Yellow
Write-Host "  1. Mo Claude Code (app tren may Hien)"
Write-Host "  2. Go lenh: cd ~/hr-bot"
Write-Host "  3. Bat dau nhan lenh voi Claude!"
Write-Host ""
Write-Host "Thu muc code: $repoDir" -ForegroundColor Green
Write-Host ""
Read-Host "Nhan Enter de thoat"
