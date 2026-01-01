# 简单的 Git 历史清理脚本
# 清理 SQLite 和 .env 文件

Write-Host "⚠️  警告：此操作会重写 Git 历史！" -ForegroundColor Red
Write-Host ""
Write-Host "将清理以下文件："
Write-Host "  - *sqlite* (所有 SQLite 文件)"
Write-Host "  - *.env* (所有 .env 文件)"
Write-Host "  - **/*docs*/ (所有 docs 目录)"
Write-Host ""

$confirm = Read-Host "确认继续？输入 'yes' 继续"

if ($confirm -ne "yes") {
    Write-Host "操作已取消" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "开始清理..." -ForegroundColor Green

# 使用 git filter-branch 清理（不需要额外安装）
Write-Host "清理 SQLite 文件..." -ForegroundColor Cyan
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch -r '*sqlite*'" --prune-empty --tag-name-filter cat -- --all

Write-Host "清理 .env 文件..." -ForegroundColor Cyan
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch -r '*.env*'" --prune-empty --tag-name-filter cat -- --all

Write-Host "清理 docs 目录..." -ForegroundColor Cyan
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch -r '**/*docs*/'" --prune-empty --tag-name-filter cat -- --all

Write-Host "清理引用和优化..." -ForegroundColor Cyan
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "✅ 清理完成！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步操作："
Write-Host "1. 检查结果：git log --all --oneline | Select-Object -First 10"
Write-Host "2. 如果满意，强制推送：git push --force --all"
Write-Host "3. 清理远程标签：git push --force --tags"

