# 手动创建数据库指南

如果自动脚本无法运行，可以手动创建数据库。

## 步骤

### 1. 使用 SQLite 命令行工具

打开命令行，进入 `frontend` 目录，然后：

```bash
sqlite3 db.sqlite
```

### 2. 复制并执行以下 SQL

在 SQLite 提示符下，逐个执行以下语句（或直接复制整个文件内容）：

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  emailVerified INTEGER,
  image TEXT,
  createdAt INTEGER,
  updatedAt INTEGER
);

-- Body parts table
CREATE TABLE IF NOT EXISTS body_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  body_part_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (body_part_id) REFERENCES body_parts(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, date)
);

-- Workout body parts junction table
CREATE TABLE IF NOT EXISTS workout_body_parts (
  workout_id INTEGER NOT NULL,
  body_part_id INTEGER NOT NULL,
  PRIMARY KEY (workout_id, body_part_id),
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (body_part_id) REFERENCES body_parts(id) ON DELETE CASCADE
);

-- Workout sets table
CREATE TABLE IF NOT EXISTS workout_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  workout_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
  UNIQUE(workout_id, exercise_id)
);

-- Sets table
CREATE TABLE IF NOT EXISTS sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  workout_set_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  weight REAL NOT NULL,
  reps INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workout_set_id) REFERENCES workout_sets(id) ON DELETE CASCADE
);
```

### 3. 验证

```sql
.tables
.schema
.quit
```

### 4. 或者使用文件

如果你有 SQLite 命令行工具，可以直接：

```bash
sqlite3 db.sqlite < scripts/init-db.sql
```

## 使用 DB Browser for SQLite（GUI 工具）

1. 下载安装：https://sqlitebrowser.org/
2. 打开软件
3. 新建数据库 → 保存为 `db.sqlite`
4. 执行 SQL → 打开 `scripts/init-db.sql` 文件
5. 执行所有 SQL 语句

