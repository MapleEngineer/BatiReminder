import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('batireminderdb');

export function initDB() {
  db.execSync(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    done INTEGER DEFAULT 0,
    importance TEXT NOT NULL,
    categoria TEXT NOT NULL,
    titulo TEXT,
    descripcion TEXT,
    fecha TEXT,
    deleted INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pendiente'
  );`);

  db.execSync(`CREATE TABLE IF NOT EXISTS proyectos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL
  );`);

  db.execSync(`CREATE TABLE IF NOT EXISTS pasos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proyecto_id INTEGER,
    nombre TEXT NOT NULL,
    fecha_inicio TEXT,
    fecha_fin TEXT,
    status TEXT DEFAULT 'pendiente'
  );`);

  db.execSync(`CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL
  );`);

  db.execSync(`CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT NOT NULL,
    meta TEXT DEFAULT '',
    timestamp TEXT DEFAULT (datetime('now', 'localtime'))
  );`);

  // Migrations
  try { db.execSync(`ALTER TABLE analytics ADD COLUMN meta TEXT DEFAULT ''`); } catch (e) {}
  try { db.execSync(`ALTER TABLE pasos ADD COLUMN status TEXT DEFAULT 'pendiente'`); } catch (e) {}

  const cats = db.getAllSync('SELECT * FROM categorias');
  if (cats.length === 0) {
    db.execSync(`INSERT INTO categorias (nombre) VALUES ('Escuela');`);
    db.execSync(`INSERT INTO categorias (nombre) VALUES ('Personal');`);
    db.execSync(`INSERT INTO categorias (nombre) VALUES ('Casa');`);
    db.execSync(`INSERT INTO categorias (nombre) VALUES ('Medico');`);
    db.execSync(`INSERT INTO categorias (nombre) VALUES ('Gym');`);
    db.execSync(`INSERT INTO categorias (nombre) VALUES ('Social');`);
  }
}

export function track(event: string, meta: string = '') {
  try {
    db.runSync(`INSERT INTO analytics (event, meta) VALUES (?, ?)`, [event, meta]);
  } catch (e) {
    console.log('track error:', e);
  }
}

export default db;