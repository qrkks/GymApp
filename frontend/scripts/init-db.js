const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './db.sqlite';
const sqlFile = path.join(__dirname, 'init-db.sql');

console.log('Initializing database...');
console.log(`Database path: ${dbPath}`);

const db = new Database(dbPath);

try {
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

