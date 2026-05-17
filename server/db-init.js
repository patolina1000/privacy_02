
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./tokens.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tokens (
    token TEXT PRIMARY KEY,
    valor REAL,
    user TEXT,
    plano TEXT,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

db.close();
