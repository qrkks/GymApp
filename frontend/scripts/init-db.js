const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './db.sqlite';
const sqlFile = path.join(__dirname, 'init-db.sql');

console.log('Initializing database...');
console.log(`Database path: ${dbPath}`);

const db = new Database(dbPath, {
  // 启用WAL模式以提高并发性能
  // WAL模式允许多个读取器和一个写入器同时工作
});

try {
  // 配置SQLite优化参数
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 1000000'); // 1GB cache
  db.pragma('temp_store = memory');
  db.pragma('mmap_size = 268435456'); // 256MB memory map

  console.log('✅ SQLite optimizations applied:');
  console.log('  - WAL mode enabled');
  console.log('  - Synchronous = NORMAL');
  console.log('  - Cache size = 1GB');
  console.log('  - Memory temp store');

  // Read and execute SQL file
  const sql = fs.readFileSync(sqlFile, 'utf8');

  // Execute each statement
  db.exec(sql);
  
  console.log('✅ Database initialized successfully!');
  console.log(`Database location: ${dbPath}`);
} catch (error) {
  console.error('❌ Error initializing database:', error);
  process.exit(1);
} finally {
  db.close();
}

