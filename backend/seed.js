// Run once after `docker-compose up -d` to create the default admin user.
// Usage: node seed.js

const mysql  = require('mysql2/promise');
const bcrypt = require('bcrypt');

const DB = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'anabana',
  password: process.env.DB_PASSWORD || 'anabana123',
  database: process.env.DB_NAME     || 'anabana',
};

async function seed() {
  const conn = await mysql.createConnection(DB);

  const users = [
    { email: 'admin@anabana.ge', password: 'admin123', first: 'Super',  last: 'Admin', role: 'admin' },
    { email: 'user@anabana.ge',  password: 'user123',  first: 'Demo',   last: 'User',  role: 'user'  },
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

  await conn.end();
  console.log('\nDone.');
}

seed().catch((err) => { console.error(err); process.exit(1); });
