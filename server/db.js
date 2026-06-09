const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'users.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// migrate: add role column to existing DB if missing
const cols = db.prepare("PRAGMA table_info(users)").all();
if (!cols.find(c => c.name === 'role')) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
}

module.exports = db;
