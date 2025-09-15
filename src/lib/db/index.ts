import { setUserAcceptedTerms } from '$lib/auth.server';
import { Database } from 'bun:sqlite';

// Create/open database
const db = new Database('src/lib/db/room39.db');
db.run('PRAGMA log_queries = ON');

const originalRun = db.run;
const originalPrepare = db.prepare;

db.run = function (sql: string): any {
	console.log('🔍 DB RUN:', sql);
	return originalRun.call(this, sql);
};

db.prepare = function (sql: string): any {
	console.log('🔍 DB PREPARE:', sql);
	return originalPrepare.call(this, sql);
};

export interface User {
	id: number;
	firstname: string;
	surname: string;
	user_type: 'student' | 'supervisor';
	accepted_terms: boolean;
	created_at: string;
}

export interface Section {
	id: number;
	section_name: string;
	description: string;
	created_at: string;
}

export interface Reservation {
	id: number;
	user_id: number;
	section_id: number;
	date: string; // Format: 'YYYY-MM-DD'
	start_time: string; // Format: 'HH:MM'
	end_time: string; // Format: 'HH:MM'
	status: 'pending' | 'confirmed' | 'cancelled';
	supervisor_id: number | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface SupervisorAvailability {
	id: number;
	supervisor_id: number;
	date: string; // Format: 'YYYY-MM-DD'
	start_time: string; // Format: 'HH:MM'
	end_time: string; // Format: 'HH:MM'
}

export interface ReservationWithDetails extends Reservation {
	firstname: string;
	surname: string;
	section_name: string;
	supervisor_firstname: string | null;
	supervisor_surname: string | null;
}

export interface ReservationResult {
	id: number;
	status: 'pending' | 'confirmed';
	needsSupervisor: boolean;
}

export const queries = {
	// User operations
	createUser: db.prepare(`
    INSERT INTO users (id, firstname, surname, user_type)
    VALUES (?, ?, ?, ?)
  `),

	acceptTerms: db.prepare(`
    UPDATE users
    SET accepted_terms = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `),

	getUserById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),

	getAllUsers: db.prepare(`
    SELECT * FROM users ORDER BY firstname, surname
  `),

	// Section operations
	getAllSections: db.prepare(`
    SELECT * FROM sections ORDER BY section_name
  `),

	getSectionById: db.prepare(`
    SELECT * FROM sections WHERE id = ?
  `),

	// Reservation operations
	createReservation: db.prepare(`
    INSERT INTO reservations (user_id, section_id, date, start_time, end_time, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

	getReservationById: db.prepare(`
    SELECT * FROM reservations WHERE id = ?
  `),

	getReservationsByDate: db.prepare(`
    SELECT
      r.*,
      u.firstname,
      u.surname,
      s.section_name,
      sup.firstname as supervisor_firstname,
      sup.surname as supervisor_surname
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    JOIN sections s ON r.section_id = s.id
    LEFT JOIN users sup ON r.supervisor_id = sup.id
    WHERE r.date = ?
    ORDER BY r.start_time
  `),

	getReservationsByUser: db.prepare(`
    SELECT
      r.*,
      s.section_name
    FROM reservations r
    JOIN sections s ON r.section_id = s.id
    WHERE r.user_id = ?
    ORDER BY r.date DESC, r.start_time DESC
  `),

	getPendingReservations: db.prepare(`
    SELECT
      r.*,
      u.firstname,
      u.surname,
      s.section_name
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    JOIN sections s ON r.section_id = s.id
    WHERE r.status = 'pending'
    ORDER BY r.date, r.start_time
  `),

	// Check if section is available (no conflicting reservations)
	checkSectionAvailability: db.prepare(`
    SELECT COUNT(*) as count
    FROM reservations
    WHERE section_id = ?
    AND date = ?
    AND status != 'cancelled'
    AND (
      (start_time < ? AND end_time > ?) OR
      (start_time < ? AND end_time > ?) OR
      (start_time >= ? AND start_time < ?) OR
      (end_time > ? AND end_time <= ?)
    )
  `),

	// Supervisor availability operations
	addSupervisorAvailability: db.prepare(`
    INSERT OR REPLACE INTO supervisor_availability (supervisor_id, date, start_time, end_time)
    VALUES (?, ?, ?, ?)
  `),

	getSupervisorAvailability: db.prepare(`
    SELECT
      sa.*,
      u.firstname,
      u.surname
    FROM supervisor_availability sa
    JOIN users u ON sa.supervisor_id = u.id
    WHERE sa.date = ?
    ORDER BY sa.start_time
  `),

	getSupervisorAvailabilityById: db.prepare(`
    SELECT * FROM supervisor_availability WHERE supervisor_id = ? AND date = ?
  `),

	deleteSupervisorAvailability: db.prepare(`
    DELETE FROM supervisor_availability WHERE supervisor_id = ? AND date = ? AND start_time = ? AND end_time = ?
  `),

	// Check if any supervisor is available for specific time slot
	checkSupervisorAvailable: db.prepare(`
    SELECT COUNT(*) as count
    FROM supervisor_availability sa
    JOIN users u ON sa.supervisor_id = u.id
    WHERE sa.date = ?
    AND sa.start_time <= ?
    AND sa.end_time >= ?
    AND u.user_type = 'supervisor'
  `),

	// Update reservation status and assign supervisor
	confirmReservation: db.prepare(`
    UPDATE reservations
    SET status = 'confirmed', supervisor_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

	updateReservationStatus: db.prepare(`
    UPDATE reservations
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

	// Cancel reservation
	cancelReservation: db.prepare(`
    UPDATE reservations
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
};

// Helper functions with proper typing
export const dbHelpers = {
	user: {
		createUser(
			id: string,
			firstname: string,
			surname: string,
			user_type: 'student' | 'supervisor' = 'student'
		): void {
			queries.createUser.run(id, firstname, surname, user_type);
		},
		getUserById(userId: number): User | null {
			const user = queries.getUserById.get(userId) as User | undefined;
			return user || null;
		},
		setUserAcceptedTerms(userId: number): void {
			queries.acceptTerms.run(userId);
		}
	},
	isValidTime(time: string): boolean {
		const [hours] = time.split(':').map(Number);
		return hours >= 8 && hours < 20;
	},

	// Parse time string to minutes for easier comparison
	timeToMinutes(time: string): number {
		const [hours, minutes] = time.split(':').map(Number);
		return hours * 60 + minutes;
	},

	// Check if section is available for reservation
	isSectionAvailable(sectionId: number, date: string, startTime: string, endTime: string): boolean {
		const result = queries.checkSectionAvailability.get(
			sectionId,
			date,
			startTime,
			endTime, // Check if new start overlaps with existing
			startTime,
			endTime, // Check if new end overlaps with existing
			startTime,
			endTime, // Check if new reservation is within existing
			startTime,
			endTime // Check if new reservation contains existing
		) as { count: number };
		return result.count === 0;
	},

	// Check if any supervisor is available
	isSupervisorAvailable(date: string, startTime: string, endTime: string): boolean {
		const result = queries.checkSupervisorAvailable.get(date, startTime, endTime) as {
			count: number;
		};
		return result.count > 0;
	},

	// Get available supervisors for a time slot
	getAvailableSupervisors(
		date: string,
		startTime: string,
		endTime: string
	): SupervisorAvailability[] {
		return queries.getSupervisorAvailability.all(date) as SupervisorAvailability[];
	},

	// Create a reservation with automatic status detection
	makeReservation(
		userId: number,
		sectionId: number,
		date: string,
		startTime: string,
		endTime: string,
		notes: string = ''
	): ReservationResult {
		// Validate time range
		if (!this.isValidTime(startTime) || !this.isValidTime(endTime)) {
			throw new Error('Reservations only allowed between 8:00 and 20:00');
		}

		// Validate start time is before end time
		if (this.timeToMinutes(startTime) >= this.timeToMinutes(endTime)) {
			throw new Error('Start time must be before end time');
		}

		// Check section availability
		const available = this.isSectionAvailable(sectionId, date, startTime, endTime);
		if (!available) {
			throw new Error('Section is already booked for this time slot');
		}

		// Check supervisor availability
		const supervisorAvailable = this.isSupervisorAvailable(date, startTime, endTime);
		const status: 'confirmed' | 'pending' = supervisorAvailable ? 'confirmed' : 'pending';

		// Create reservation
		const result = queries.createReservation.run(
			userId,
			sectionId,
			date,
			startTime,
			endTime,
			status,
			notes
		);

		return {
			id: Number(result.lastInsertRowid),
			status,
			needsSupervisor: !supervisorAvailable
		};
	},

	// Get all reservations for a specific section on a date
	getSectionReservations(sectionId: number, date: string): Reservation[] {
		const allReservations = queries.getReservationsByDate.all(date) as ReservationWithDetails[];
		return allReservations.filter((r) => r.section_id === sectionId && r.status !== 'cancelled');
	},

	// Get user by ID with type safety
	getUser(userId: number): User | null {
		const user = queries.getUserById.get(userId) as User | undefined;
		return user || null;
	},

	// Get section by ID with type safety
	getSection(sectionId: number): Section | null {
		const section = queries.getSectionById.get(sectionId) as Section | undefined;
		return section || null;
	}
};

export { db };
export default db;
