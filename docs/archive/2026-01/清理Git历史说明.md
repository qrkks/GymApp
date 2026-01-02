# 清理 Git 历史说明

## ⚠️ 重要警告

清理 Git 历史会**重写所有提交历史**，这是一个**不可逆**的操作！

**操作前必须：**
1. ✅ 备份整个仓库
2. ✅ 确保所有重要更改都已提交
3. ✅ 通知团队成员（如果多人协作）
4. ✅ 确认远程仓库可以强制推送

---

## 当前 .gitignore 规则

根据根目录的 `.gitignore`，需要清理的文件：

1. `*sqlite*` - 所有 SQLite 数据库文件
2. `*.env*` - 所有环境变量文件
3. `**/*docs*/` - 所有包含 docs 的目录

---

## 清理方法

### 方法 1：使用 git filter-repo（推荐）

**安装 git-filter-repo：**
```bash
# Windows (使用 pip)
pip install git-filter-repo

# 或使用 scoop
scoop install git-filter-repo
```

**执行清理：**
```bash
# 清理 SQLite 文件
git filter-repo --path-glob '*sqlite*' --invert-paths --force

# 清理 .env 文件
git filter-repo --path-glob '*.env*' --invert-paths --force

# 清理 docs 目录
git filter-repo --path-glob '**/*docs*/**' --invert-paths --force

# 清理引用
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

---

### 方法 2：使用 git filter-branch（内置，但较慢）

```bash
# 清理 SQLite 文件
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch -r '*sqlite*'" --prune-empty --tag-name-filter cat -- --all

# 清理 .env 文件
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch -r '*.env*'" --prune-empty --tag-name-filter cat -- --all

# 清理 docs 目录
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch -r '**/*docs*/'" --prune-empty --tag-name-filter cat -- --all

# 清理引用
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

---

### 方法 3：使用脚本（已创建）

**Windows PowerShell：**
```powershell
.\scripts\clean-git-history.ps1
```

**Linux/Mac：**
```bash
chmod +x scripts/clean-git-history.sh
./scripts/clean-git-history.sh
```

---

## 清理后的操作

### 1. 检查清理结果

```bash
# 查看提交历史
git log --all --oneline

# 检查文件是否还在历史中
git log --all --pretty=format: --name-only --diff-filter=A | findstr /i "sqlite"
git log --all --pretty=format: --name-only --diff-filter=A | findstr /i "\.env"
```

### 2. 强制推送到远程

⚠️ **警告：这会覆盖远程仓库的历史！**

```bash
# 强制推送所有分支
git push --force --all

# 强制推送所有标签
git push --force --tags
```

### 3. 通知团队成员

所有团队成员需要：

```bash
# 删除本地仓库，重新克隆
cd ..
rm -rf GymApp
git clone <repository-url> GymApp
cd GymApp
```

或者：

```bash
# 重置本地分支
git fetch origin
git reset --hard origin/main
```

---

## 注意事项

1. **备份**：清理前务必备份整个仓库
2. **协作**：如果是多人协作项目，需要协调所有成员
3. **分支**：清理会影响所有分支
4. **标签**：清理会影响所有标签
5. **不可逆**：一旦推送，无法恢复

---

## 当前状态

已从 Git 跟踪中移除的文件：
- ✅ `frontend/db.sqlite`
- ✅ `frontend/.env.production`

这些文件现在会被 `.gitignore` 忽略，但**仍在 Git 历史中**。

如果要完全从历史中移除，需要执行上述清理操作。

