// Alternative database initialization using sql.js (pure JavaScript)
// This doesn't require native bindings but is slower

const fs = require('fs');
const path = require('path');

// Try to use better-sqlite3 first, fallback to manual SQL execution
const dbPath = process.env.DATABASE_PATH || './db.sqlite';
const sqlFile = path.join(__dirname, 'init-db.sql');

console.log('Initializing database...');
console.log(`Database path: ${dbPath}`);

// Read SQL file
const sql = fs.readFileSync(sqlFile, 'utf8');

// Split SQL into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

// Try to use better-sqlite3
let Database;
try {
  Database = require('better-sqlite3');
  const db = new Database(dbPath);
  
  // Execute each statement
  statements.forEach(statement => {
    try {
      db.exec(statement);
    } catch (err) {
      // Ignore "already exists" errors
      if (!err.message.includes('already exists')) {
        console.warn(`Warning executing statement: ${err.message}`);
      }
    }
  });
  
  db.close();
  console.log('✅ Database initialized successfully using better-sqlite3!');
  console.log(`Database location: ${dbPath}`);
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND' || error.message.includes('bindings')) {
    console.error('❌ better-sqlite3 native bindings not found.');
    console.error('\nPlease try one of these solutions:');
    console.error('1. Rebuild better-sqlite3: npm rebuild better-sqlite3');
    console.error('2. Use SQLite3 command line: sqlite3 db.sqlite < scripts/init-db.sql');
    console.error('3. Install SQLite3 and use: npm run db:init-sqlite3');
    console.error('\nFor Windows, you can download SQLite from:');
    console.error('https://www.sqlite.org/download.html');
    process.exit(1);
  } else {
    throw error;
  }
}

