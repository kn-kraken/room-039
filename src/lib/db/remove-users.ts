import Database from 'bun:sqlite';

// remove all users
const db = new Database('./room39.db');
db.run('DELETE FROM users;');
db.run('DELETE FROM sqlite_sequence WHERE name="users";'); // reset autoincrement

console.log('All users removed from the database.');
