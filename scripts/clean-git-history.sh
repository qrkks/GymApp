#!/bin/bash
# 清理 Git 历史中应该被忽略的文件
# 根据 .gitignore 规则清理

set -e

echo "⚠️  警告：此操作会重写 Git 历史！"
echo "请确保："
echo "1. 已经备份了仓库"
echo "2. 已经推送到远程的所有分支都已同步"
echo "3. 团队成员都知道此操作"
echo ""
read -p "确认继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "操作已取消"
    exit 1
fi

echo ""
echo "开始清理 Git 历史..."

# 检查是否安装了 git-filter-repo
if ! command -v git-filter-repo &> /dev/null; then
    echo "⚠️  git-filter-repo 未安装，使用 git filter-branch"
    USE_FILTER_REPO=false
else
    echo "✅ 使用 git-filter-repo（推荐）"
    USE_FILTER_REPO=true
fi

# 清理 SQLite 文件
echo ""
echo "1. 清理 SQLite 文件 (*sqlite*)..."
if [ "$USE_FILTER_REPO" = true ]; then
    git filter-repo --path-glob '*sqlite*' --invert-paths --force
else
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch -r '*sqlite*'" \
        --prune-empty --tag-name-filter cat -- --all
fi

# 清理 .env 文件
echo ""
echo "2. 清理 .env 文件 (*.env*)..."
if [ "$USE_FILTER_REPO" = true ]; then
    git filter-repo --path-glob '*.env*' --invert-paths --force
else
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch -r '*.env*'" \
        --prune-empty --tag-name-filter cat -- --all
fi

# 清理 docs 目录
echo ""
echo "3. 清理 docs 目录 (**/*docs*/)..."
if [ "$USE_FILTER_REPO" = true ]; then
    git filter-repo --path-glob '**/*docs*/**' --invert-paths --force
else
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch -r '**/*docs*/'" \
        --prune-empty --tag-name-filter cat -- --all
fi

# 清理引用
echo ""
echo "4. 清理引用..."
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ 清理完成！"
echo ""
echo "下一步："
echo "1. 检查清理结果：git log --all --oneline"
echo "2. 如果满意，强制推送到远程：git push --force --all"
echo "3. 清理远程标签：git push --force --tags"

