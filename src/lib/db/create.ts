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
    instructions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Projects table
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    emoji TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.run(`

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
    project_id INTEGER NOT NULL DEFAULT 1,
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
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    -- Prevent double booking of same section at same time
    UNIQUE(section_id, date, start_time, end_time)
  );
`);

// Insert default sections for Room 39
const insertSection = db.prepare(`
  INSERT OR IGNORE INTO sections (section_name, description, instructions)
  VALUES (?, ?, ?)
`);

insertSection.run(
	'Boks 1',
	'Pierwszy boks od lewej',
	'• Pierwszy boks od lewej\n• Idealny do spotkań oraz pracy zespołowej w grupach 2-4\n• Pozwala w spokoju i ciszy prowadzić badania'
);
insertSection.run(
	'Boks 2',
	'Drugi boks od lewej',
	'• Drugi boks od lewej\n• Idealny do spotkań oraz pracy zespołowej w grupach 2-4\n• Pozwala w spokoju i ciszy prowadzić badania'
);
insertSection.run(
	'Gniazdo',
	'Umiejscowiony na parterze',
	'• Umiejscowiony na parterze\n• Idealny na spotkania w większym gronie\n• Posiada dotykowy ekran pozwalający na wizualizację zagadnień i prowadzenie prezentacji'
);

// Insert default projects
const insertProject = db.prepare(`
  INSERT OR IGNORE INTO projects (name, emoji)
  VALUES (?, ?)
`);

insertProject.run('Kraken', '🐙');
insertProject.run('Design Factory', '🏭');
insertProject.run('Inne', '📝');

// Insert sample users
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, firstname, surname, user_type, accepted_terms)
  VALUES (?, ?, ?, ?, ?)
`);

insertUser.run(1, 'Jan', 'Kowalski', 'student', 1);
insertUser.run(2, 'Dr. Anna', 'Nowak', 'supervisor', 1);
insertUser.run(3, 'Maria', 'Wiśniewska', 'student', 1);
insertUser.run(4, 'Prof. Piotr', 'Zieliński', 'supervisor', 1);

// Insert sample reservations for today and tomorrow
const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const insertReservation = db.prepare(`
  INSERT OR IGNORE INTO reservations (user_id, section_id, date, start_time, end_time, status, supervisor_id, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Today's reservations
insertReservation.run(
	1,
	1,
	today,
	'09:00',
	'11:00',
	'confirmed',
	2,
	'Working on electronics project'
);
insertReservation.run(3, 2, today, '14:00', '16:00', 'pending', null, 'Programming session');
// insertReservation.run(1, 3, today, '10:30', '12:00', 'confirmed', 4, 'Research work');

// Tomorrow's reservations
insertReservation.run(3, 1, tomorrow, '08:00', '10:00', 'confirmed', 2, 'Lab experiment');
insertReservation.run(1, 2, tomorrow, '13:00', '15:00', 'pending', null, 'Project development');

console.log('Database initialized with sample data');
