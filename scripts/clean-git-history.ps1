# PowerShell 脚本：清理 Git 历史中应该被忽略的文件
# 根据 .gitignore 规则清理

Write-Host "⚠️  警告：此操作会重写 Git 历史！" -ForegroundColor Yellow
Write-Host "请确保："
Write-Host "1. 已经备份了仓库"
Write-Host "2. 已经推送到远程的所有分支都已同步"
Write-Host "3. 团队成员都知道此操作"
Write-Host ""

$confirm = Read-Host "确认继续？(yes/no)"

if ($confirm -ne "yes") {
    Write-Host "操作已取消" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "开始清理 Git 历史..." -ForegroundColor Green

# 检查是否安装了 git-filter-repo
$hasFilterRepo = Get-Command git-filter-repo -ErrorAction SilentlyContinue

if (-not $hasFilterRepo) {
    Write-Host "⚠️  git-filter-repo 未安装，使用 git filter-branch" -ForegroundColor Yellow
    $USE_FILTER_REPO = $false
} else {
    Write-Host "✅ 使用 git-filter-repo（推荐）" -ForegroundColor Green
    $USE_FILTER_REPO = $true
}

# 清理 SQLite 文件
Write-Host ""
Write-Host "1. 清理 SQLite 文件 (*sqlite*)..." -ForegroundColor Cyan
if ($USE_FILTER_REPO) {
    git filter-repo --path-glob '*sqlite*' --invert-paths --force
} else {
    git filter-branch --force --index-filter "git rm --cached --ignore-unmatch -r '*sqlite*'" --prune-empty --tag-name-filter cat -- --all
}

# 清理 .env 文件
Write-Host ""
Write-Host "2. 清理 .env 文件 (*.env*)..." -ForegroundColor Cyan
if ($USE_FILTER_REPO) {
    git filter-repo --path-glob '*.env*' --invert-paths --force
} else {
    git filter-branch --force --index-filter "git rm --cached --ignore-unmatch -r '*.env*'" --prune-empty --tag-name-filter cat -- --all
}

# 清理 docs 目录
Write-Host ""
Write-Host "3. 清理 docs 目录 (**/*docs*/)..." -ForegroundColor Cyan
if ($USE_FILTER_REPO) {
    git filter-repo --path-glob '**/*docs*/**' --invert-paths --force
} else {
    git filter-branch --force --index-filter "git rm --cached --ignore-unmatch -r '**/*docs*/'" --prune-empty --tag-name-filter cat -- --all
}

# 清理引用
Write-Host ""
Write-Host "4. 清理引用..." -ForegroundColor Cyan
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "✅ 清理完成！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步："
Write-Host "1. 检查清理结果：git log --all --oneline"
Write-Host "2. 如果满意，强制推送到远程：git push --force --all"
Write-Host "3. 清理远程标签：git push --force --tags"

