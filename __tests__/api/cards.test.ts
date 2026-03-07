/**
 * Unit tests for api/cards.ts
 *
 * fetch() is mocked so no real network calls are made.
 */

import {
  fetchCard,
  fetchCards,
  createCard,
  updateCard,
  deleteCard,
} from '../../api/cards';

function mockFetch(status: number, body: unknown) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  };
  global.fetch = jest.fn().mockResolvedValue(response) as any;
  return response;
}

const BASE = 'http://localhost:3001';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('fetchCard', () => {
  it('calls GET /cards/:id and parses JSON content string', async () => {
    const raw = { id: 7, type: 'new_letter', title: 'ა', content: '{"letter":"ა"}', sort_order: 1 };
    mockFetch(200, raw);
    const result = await fetchCard(7);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/cards/7`);
    expect(result.content).toEqual({ letter: 'ა' });
  });

  it('returns card with object content as-is', async () => {
    const raw = { id: 3, type: 'book', title: null, content: { pages: [] }, sort_order: 2 };
    mockFetch(200, raw);
    const result = await fetchCard(3);
    expect(result.content).toEqual({ pages: [] });
  });

  it('falls back to empty object for invalid JSON content', async () => {
    const raw = { id: 1, type: 'book', title: null, content: 'not-json', sort_order: 1 };
    mockFetch(200, raw);
    const result = await fetchCard(1);
    expect(result.content).toEqual({});
  });

  it('throws on 404', async () => {
    mockFetch(404, { error: 'not found' });
    await expect(fetchCard(99)).rejects.toThrow('Failed to fetch card: 404');
  });

  it('throws on 500', async () => {
    mockFetch(500, { error: 'server error' });
    await expect(fetchCard(1)).rejects.toThrow('Failed to fetch card: 500');
  });
});

describe('fetchCards', () => {
  it('calls GET /cards and parses content for each card', async () => {
    const rows = [
      { id: 1, type: 'book', title: null, content: '{"pages":[]}', sort_order: 1 },
      { id: 2, type: 'new_letter', title: 'ბ', content: { letter: 'ბ' }, sort_order: 2 },
    ];
    mockFetch(200, rows);
    const result = await fetchCards();
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/cards`);
    expect(result[0].content).toEqual({ pages: [] });
    expect(result[1].content).toEqual({ letter: 'ბ' });
  });

  it('throws on non-ok response', async () => {
    mockFetch(500, { error: 'fail' });
    await expect(fetchCards()).rejects.toThrow('Failed to fetch cards: 500');
  });
});

describe('createCard', () => {
  it('calls POST /cards with type and returns created card', async () => {
    const created = { id: 10, type: 'book', title: null, content: {}, sort_order: 1 };
    mockFetch(201, created);
    const result = await createCard({ type: 'book' });
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/cards`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type: 'book' }),
      })
    );
    expect(result).toEqual(created);
  });

  it('sends title and content when provided', async () => {
    const created = { id: 11, type: 'new_letter', title: 'ა', content: { letter: 'ა' }, sort_order: 2 };
    mockFetch(201, created);
    await createCard({ type: 'new_letter', title: 'ა', content: { letter: 'ა' } });
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/cards`,
      expect.objectContaining({
        body: JSON.stringify({ type: 'new_letter', title: 'ა', content: { letter: 'ა' } }),
      })
    );
  });

  it('sends sections in content for new_letter type', async () => {
    const sections = {
      instruction_video: { hidden: false, title: 'ინსტრუქციის ვიდეო', video_url: '' },
      intro_video:       { hidden: true,  title: 'ახალი ასოს ვიდეო',  video_url: 'https://example.com' },
      say_sound_parent:  { hidden: false, title: 'წარმოთქვი ბგერა (მშობლისთვის)' },
      say_sound_kid:     { hidden: false, title: 'წარმოთქვი ბგერა (ბავშვისთვის)' },
      what_letter:       { hidden: false, title: 'რომელი ასოა?' },
    };
    const content = { letter: 'ა', example_word: 'ანა', sections };
    const created = { id: 12, type: 'new_letter', title: 'ა', content, sort_order: 3 };
    mockFetch(201, created);
    await createCard({ type: 'new_letter', title: 'ა', content });
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/cards`,
      expect.objectContaining({
        body: JSON.stringify({ type: 'new_letter', title: 'ა', content }),
      })
    );
  });

  it('throws on failure', async () => {
    mockFetch(400, { error: 'bad request' });
    await expect(createCard({ type: 'book' })).rejects.toThrow('Failed to create card: 400');
  });
});

describe('updateCard', () => {
  it('sends updated sections in content for new_letter', async () => {
    const sections = {
      instruction_video: { hidden: true, title: 'ინსტრუქციის ვიდეო', video_url: '' },
      say_sound_parent:  { hidden: false, title: 'ბგერა' },
    };
    const content = { letter: 'ბ', example_word: 'ბაბა', sections };
    mockFetch(200, { id: 5, type: 'new_letter', title: 'ბ', content, sort_order: 1 });
    await updateCard(5, { content });
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/cards/5`,
      expect.objectContaining({ body: JSON.stringify({ content }) })
    );
  });

  it('calls PUT /cards/:id and returns updated card', async () => {
    const updated = { id: 5, type: 'new_letter', title: 'გ', content: { letter: 'გ' }, sort_order: 1 };
    mockFetch(200, updated);
    const result = await updateCard(5, { title: 'გ', content: { letter: 'გ' } });
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/cards/5`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ title: 'გ', content: { letter: 'გ' } }),
      })
    );
    expect(result).toEqual(updated);
  });

  it('throws on failure', async () => {
    mockFetch(500, { error: 'fail' });
    await expect(updateCard(5, {})).rejects.toThrow('Failed to update card: 500');
  });
});

describe('deleteCard', () => {
  it('calls DELETE /cards/:id', async () => {
    mockFetch(200, { success: true });
    await deleteCard(3);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/cards/3`, { method: 'DELETE' });
  });

  it('throws on failure', async () => {
    mockFetch(500, { error: 'fail' });
    await expect(deleteCard(3)).rejects.toThrow('Failed to delete card: 500');
  });
});
