const express = require('express');
const mysql   = require('mysql2/promise');
const bcrypt  = require('bcrypt');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'anabana',
  password: process.env.DB_PASSWORD || 'anabana123',
  database: process.env.DB_NAME     || 'anabana',
  waitForConnections: true,
  connectionLimit: 10,
});

// Ensure user_progress table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS user_progress (
    user_id    INT NOT NULL,
    lesson_id  INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, lesson_id),
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  )
`).catch(err => console.error('Migration error:', err.message));

// GET /lessons
app.get('/lessons', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM lessons ORDER BY sort_order, id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /lessons/:id
app.get('/lessons/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /lessons/:id/cards
app.get('/lessons/:id/cards', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.* FROM cards c
       JOIN lesson_cards lc ON lc.card_id = c.id
       WHERE lc.lesson_id = ?
       ORDER BY lc.sort_order, c.id`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /lessons/:id/cards/:cardId
app.post('/lessons/:id/cards/:cardId', async (req, res) => {
  try {
    const { id, cardId } = req.params;
    const [[{ maxOrder }]] = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM lesson_cards WHERE lesson_id = ?',
      [id]
    );
    await pool.query(
      'INSERT INTO lesson_cards (lesson_id, card_id, sort_order) VALUES (?, ?, ?)',
      [id, cardId, maxOrder + 1]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'already assigned' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /lessons/:id/cards/:cardId
app.delete('/lessons/:id/cards/:cardId', async (req, res) => {
  try {
    const { id, cardId } = req.params;
    await pool.query('DELETE FROM lesson_cards WHERE lesson_id = ? AND card_id = ?', [id, cardId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /lessons
app.post('/lessons', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const [[{ maxOrder }]] = await pool.query('SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM lessons');
    const [result] = await pool.query(
      'INSERT INTO lessons (title, sort_order) VALUES (?, ?)',
      [title, maxOrder + 1]
    );
    const [[row]] = await pool.query('SELECT * FROM lessons WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /lessons/:id
app.put('/lessons/:id', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    await pool.query('UPDATE lessons SET title = ? WHERE id = ?', [title, req.params.id]);
    const [[row]] = await pool.query('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /lessons/:id
app.delete('/lessons/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM lessons WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Users ────────────────────────────────────────────────────────────────────

const USER_FIELDS = 'id, email, first_name, last_name, role, is_active, avatar_url, created_at, updated_at';

// GET /users
app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ${USER_FIELDS} FROM users ORDER BY created_at DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id
app.get('/users/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users
app.post('/users', async (req, res) => {
  try {
    const { email, password, first_name = '', last_name = '', role = 'user', avatar_url = null } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?)',
      [email, password_hash, first_name, last_name, role, avatar_url]
    );
    const [[row]] = await pool.query(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [result.insertId]);
    res.status(201).json(row);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /users/:id
app.put('/users/:id', async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, is_active, avatar_url } = req.body;
    const fields = [];
    const values = [];
    if (email      !== undefined) { fields.push('email = ?');      values.push(email); }
    if (first_name !== undefined) { fields.push('first_name = ?'); values.push(first_name); }
    if (last_name  !== undefined) { fields.push('last_name = ?');  values.push(last_name); }
    if (role       !== undefined) { fields.push('role = ?');       values.push(role); }
    if (is_active  !== undefined) { fields.push('is_active = ?');  values.push(is_active ? 1 : 0); }
    if (avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(avatar_url); }
    if (password)                 { fields.push('password_hash = ?'); values.push(await bcrypt.hash(password, 10)); }
    if (!fields.length) return res.status(400).json({ error: 'nothing to update' });
    values.push(req.params.id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    const [[row]] = await pool.query(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /users/:id
app.delete('/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const [[user]] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !user.is_active) return res.status(401).json({ error: 'invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'invalid credentials' });
    const { password_hash, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cards ─────────────────────────────────────────────────────────────────────

// GET /cards
app.get('/cards', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cards ORDER BY sort_order, id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /cards
app.post('/cards', async (req, res) => {
  try {
    const { type, title = null, content = {} } = req.body;
    if (!type) return res.status(400).json({ error: 'type is required' });
    const [[{ maxOrder }]] = await pool.query('SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM cards');
    const [result] = await pool.query(
      'INSERT INTO cards (type, sort_order, title, content) VALUES (?, ?, ?, ?)',
      [type, maxOrder + 1, title, JSON.stringify(content)]
    );
    const [[row]] = await pool.query('SELECT * FROM cards WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /cards/:id
app.get('/cards/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /cards/:id
app.put('/cards/:id', async (req, res) => {
  try {
    const { title, content, sort_order } = req.body;
    const fields = [], values = [];
    if (title      !== undefined) { fields.push('title = ?');      values.push(title); }
    if (content    !== undefined) { fields.push('content = ?');    values.push(JSON.stringify(content)); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }
    if (!fields.length) return res.status(400).json({ error: 'nothing to update' });
    values.push(req.params.id);
    await pool.query(`UPDATE cards SET ${fields.join(', ')} WHERE id = ?`, values);
    const [[row]] = await pool.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /cards/:id
app.delete('/cards/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cards WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── User progress ────────────────────────────────────────────────────────────

// GET /users/:id/progress
app.get('/users/:id/progress', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.sort_order FROM user_progress up
       JOIN lessons l ON l.id = up.lesson_id
       WHERE up.user_id = ?
       ORDER BY l.sort_order`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users/:id/progress/:lessonId
app.post('/users/:id/progress/:lessonId', async (req, res) => {
  try {
    await pool.query(
      'INSERT IGNORE INTO user_progress (user_id, lesson_id) VALUES (?, ?)',
      [req.params.id, req.params.lessonId]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { app, pool };

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}
