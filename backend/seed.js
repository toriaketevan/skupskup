// Run once after `docker-compose up -d` to create the default admin user.
// Usage: node seed.js

const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'skupskup',
  password: process.env.DB_PASSWORD || 'skupskup123',
  database: process.env.DB_NAME     || 'skupskup',
};

async function seed() {
  const conn = await mysql.createConnection(DB);

  const users = [
    { email: 'admin@skupskup.ge', password: 'admin123', first: 'Super',  last: 'Admin', role: 'admin' },
    { email: 'user@skupskup.ge',  password: 'user123',  first: 'Demo',   last: 'User',  role: 'user'  },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await conn.execute(
      `INSERT IGNORE INTO users (email, password_hash, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [u.email, hash, u.first, u.last, u.role]
    );
    console.log(`✓ ${u.role.padEnd(5)}  ${u.email}  (password: ${u.password})`);
  }

  // Ensure we have a clean set of lessons (only 1-7)
  await conn.execute('DELETE FROM lessons');
  await conn.execute('ALTER TABLE lessons AUTO_INCREMENT = 1');
  const lessons = [
    'Lesson 1',
    'Lesson 2',
    'Lesson 3',
    'Lesson 4',
    'Lesson 5',
    'Lesson 6',
    'Lesson 7',
  ];
  for (let i = 0; i < lessons.length; i++) {
    await conn.execute(
      'INSERT INTO lessons (title, sort_order) VALUES (?, ?)',
      [lessons[i], i + 1]
    );
  }
  console.log(`✓ Seeded ${lessons.length} lessons (1-7)`);

  await conn.end();
  console.log('\nDone.');
}

seed().catch((err) => { console.error(err); process.exit(1); });
