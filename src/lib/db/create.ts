import { Database } from 'bun:sqlite';

// Create/open database
const db = new Database('./room39.db');

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables
db.run(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY UNIQUE,
    firstname TEXT NOT NULL,
    surname TEXT NOT NULL,
    user_type TEXT CHECK(user_type IN ('student', 'supervisor')) DEFAULT 'student',
    accepted_terms BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Room sections table
  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Supervisor availability table
  CREATE TABLE IF NOT EXISTS supervisor_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supervisor_id INTEGER NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    UNIQUE(supervisor_id, date, start_time, end_time)
  );

  -- Reservations table
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT CHECK(status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
    supervisor_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    -- Prevent double booking of same section at same time
    UNIQUE(section_id, date, start_time, end_time)
  );
`);

// Insert default sections for Room 39
const insertSection = db.prepare(`
  INSERT OR IGNORE INTO sections (section_name, description)
  VALUES (?, ?)
`);

insertSection.run('Section A', 'Left side of Room 39');
insertSection.run('Section B', 'Center of Room 39');
insertSection.run('Section C', 'Right side of Room 39');
