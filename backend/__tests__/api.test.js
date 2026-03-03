/**
 * Backend integration tests (supertest).
 *
 * The MySQL pool is fully mocked so no real database is needed.
 * Each test group configures mockQuery to return controlled data,
 * then asserts the HTTP response status and body.
 */

// Shared mock function stored in module scope so the factory captures it
// We use a plain object as a holder to avoid temporal-dead-zone issues
// with const/let hoisting when jest.mock() is hoisted.
const db = { query: null };

jest.mock('mysql2/promise', () => ({
  createPool: () => ({
    // Lazily forward to db.query so we can swap it between tests
    query: (...args) => db.query(...args),
  }),
}));

// db.query must be set before requiring the app (pool.query is called at
// module load for the migration statement).
db.query = jest.fn().mockResolvedValue([[]]);

const request = require('supertest');
const { app } = require('../index');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockQuery(...results) {
  let i = 0;
  db.query.mockImplementation(() => Promise.resolve(results[i++]));
}

beforeEach(() => db.query.mockReset().mockResolvedValue([[]]));

// ─── /lessons ─────────────────────────────────────────────────────────────────

describe('GET /lessons', () => {
  it('returns list of lessons', async () => {
    const rows = [{ id: 1, title: 'L1', sort_order: 1 }];
    mockQuery([rows]);

    const res = await request(app).get('/lessons');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
  });

  it('returns 500 on db error', async () => {
    db.query.mockRejectedValue(new Error('db fail'));
    const res = await request(app).get('/lessons');
    expect(res.status).toBe(500);
  });
});

describe('GET /lessons/:id', () => {
  it('returns a single lesson', async () => {
    const lesson = { id: 2, title: 'L2', sort_order: 2 };
    mockQuery([[lesson]]);

    const res = await request(app).get('/lessons/2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(lesson);
  });

  it('returns 404 when not found', async () => {
    mockQuery([[undefined]]);
    const res = await request(app).get('/lessons/999');
    expect(res.status).toBe(404);
  });
});

describe('POST /lessons', () => {
  it('creates a lesson and returns 201', async () => {
    const created = { id: 10, title: 'New', sort_order: 1 };
    mockQuery(
      [[{ maxOrder: 0 }]],  // SELECT MAX
      [{ insertId: 10 }],   // INSERT
      [[created]],          // SELECT *
    );

    const res = await request(app).post('/lessons').send({ title: 'New' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New');
  });

  it('stores description when provided', async () => {
    const created = { id: 11, title: 'New', description: 'About this', sort_order: 2 };
    mockQuery(
      [[{ maxOrder: 1 }]],
      [{ insertId: 11 }],
      [[created]],
    );

    const res = await request(app)
      .post('/lessons')
      .send({ title: 'New', description: 'About this' });
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('About this');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/lessons').send({});
    expect(res.status).toBe(400);
  });
});

describe('PUT /lessons/:id', () => {
  it('updates a lesson title', async () => {
    const updated = { id: 3, title: 'Updated', sort_order: 1 };
    mockQuery(
      [{}],         // UPDATE
      [[updated]],  // SELECT *
    );

    const res = await request(app).put('/lessons/3').send({ title: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  it('stores description when provided', async () => {
    const updated = { id: 3, title: 'Updated', description: 'Some desc', sort_order: 1 };
    mockQuery([{}], [[updated]]);

    const res = await request(app)
      .put('/lessons/3')
      .send({ title: 'Updated', description: 'Some desc' });
    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Some desc');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).put('/lessons/3').send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /lessons/:id', () => {
  it('deletes a lesson', async () => {
    mockQuery([{}]);
    const res = await request(app).delete('/lessons/5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─── /lessons/:id/cards ───────────────────────────────────────────────────────

describe('GET /lessons/:id/cards', () => {
  it('returns cards for a lesson', async () => {
    const cards = [{ id: 1, type: 'new_letter', title: 'ა' }];
    mockQuery([cards]);

    const res = await request(app).get('/lessons/1/cards');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(cards);
  });
});

describe('POST /lessons/:id/cards/:cardId', () => {
  it('assigns a card to a lesson and returns 201', async () => {
    mockQuery(
      [[{ maxOrder: 2 }]],  // SELECT MAX
      [{}],                  // INSERT
    );

    const res = await request(app).post('/lessons/1/cards/5');
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('returns 409 on duplicate assignment', async () => {
    const dupErr = Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' });
    db.query
      .mockResolvedValueOnce([[{ maxOrder: 0 }]])
      .mockRejectedValueOnce(dupErr);

    const res = await request(app).post('/lessons/1/cards/5');
    expect(res.status).toBe(409);
  });
});

describe('DELETE /lessons/:id/cards/:cardId', () => {
  it('removes a card from a lesson', async () => {
    mockQuery([{}]);
    const res = await request(app).delete('/lessons/1/cards/5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('PUT /lessons/:id/cards/reorder', () => {
  it('updates sort_order for each card and returns success', async () => {
    // One UPDATE query per card (3 cards)
    mockQuery([{}], [{}], [{}]);
    const res = await request(app)
      .put('/lessons/1/cards/reorder')
      .send({ cardIds: [3, 1, 2] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when cardIds is not an array', async () => {
    const res = await request(app)
      .put('/lessons/1/cards/reorder')
      .send({ cardIds: 'not-an-array' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when cardIds is missing', async () => {
    const res = await request(app)
      .put('/lessons/1/cards/reorder')
      .send({});
    expect(res.status).toBe(400);
  });
});

// ─── /cards ───────────────────────────────────────────────────────────────────

describe('GET /cards', () => {
  it('returns all cards', async () => {
    const cards = [{ id: 1, type: 'book', title: null }];
    mockQuery([cards]);

    const res = await request(app).get('/cards');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(cards);
  });
});

describe('POST /cards', () => {
  it('creates a card and returns 201', async () => {
    const created = { id: 5, type: 'book', title: null, content: '{}', sort_order: 1 };
    mockQuery(
      [[{ maxOrder: 0 }]],
      [{ insertId: 5 }],
      [[created]],
    );

    const res = await request(app).post('/cards').send({ type: 'book' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('book');
  });

  it('returns 400 when type is missing', async () => {
    const res = await request(app).post('/cards').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /cards/:id', () => {
  it('returns a single card', async () => {
    const card = { id: 7, type: 'new_letter', title: 'ა', content: '{"letter":"ა"}', sort_order: 1 };
    mockQuery([[card]]);

    const res = await request(app).get('/cards/7');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(card);
  });

  it('returns 404 when card is not found', async () => {
    mockQuery([[undefined]]);
    const res = await request(app).get('/cards/999');
    expect(res.status).toBe(404);
  });

  it('returns 500 on db error', async () => {
    db.query.mockRejectedValue(new Error('db fail'));
    const res = await request(app).get('/cards/1');
    expect(res.status).toBe(500);
  });
});

describe('PUT /cards/:id', () => {
  it('updates card title and returns the card', async () => {
    const updated = { id: 3, type: 'book', title: 'ახალი', content: '{}', sort_order: 1 };
    mockQuery(
      [{}],          // UPDATE
      [[updated]],   // SELECT *
    );

    const res = await request(app).put('/cards/3').send({ title: 'ახალი' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('ახალი');
  });

  it('updates card content', async () => {
    const updated = { id: 4, type: 'new_letter', title: null, content: '{"letter":"ბ"}', sort_order: 2 };
    mockQuery([{}], [[updated]]);

    const res = await request(app).put('/cards/4').send({ content: { letter: 'ბ' } });
    expect(res.status).toBe(200);
  });

  it('returns 400 when body has no updatable fields', async () => {
    const res = await request(app).put('/cards/3').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 when card no longer exists after update', async () => {
    mockQuery([{}], [[undefined]]);
    const res = await request(app).put('/cards/99').send({ title: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /cards/:id', () => {
  it('deletes a card and returns success', async () => {
    mockQuery([{}]);
    const res = await request(app).delete('/cards/5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 500 on db error', async () => {
    db.query.mockRejectedValue(new Error('db fail'));
    const res = await request(app).delete('/cards/5');
    expect(res.status).toBe(500);
  });
});

// ─── /auth/login ──────────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('returns 400 when credentials are missing', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 when user is not found', async () => {
    mockQuery([[undefined]]);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'x@x.com', password: 'pw' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for inactive user', async () => {
    mockQuery([[{ id: 1, email: 'x@x.com', is_active: false, password_hash: 'hash' }]]);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'x@x.com', password: 'pw' });
    expect(res.status).toBe(401);
  });
});

// ─── /users ───────────────────────────────────────────────────────────────────

describe('GET /users', () => {
  it('returns list of users', async () => {
    const users = [{ id: 1, email: 'a@b.com', role: 'user' }];
    mockQuery([users]);
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(users);
  });
});

describe('POST /users', () => {
  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/users').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/users').send({ password: 'secret' });
    expect(res.status).toBe(400);
  });
});

// ─── /users/:id/progress ──────────────────────────────────────────────────────

describe('GET /users/:id/progress', () => {
  it('returns progress entries for a user', async () => {
    const rows = [{ id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }];
    mockQuery([rows]);
    const res = await request(app).get('/users/1/progress');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
  });
});

describe('POST /users/:id/progress/:lessonId', () => {
  it('marks a lesson complete and returns 201', async () => {
    mockQuery([{}]);
    const res = await request(app).post('/users/1/progress/3');
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
