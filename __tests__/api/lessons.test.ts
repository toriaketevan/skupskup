/**
 * Unit tests for api/lessons.ts
 *
 * fetch() is mocked so no real network calls are made.
 * Tests verify that the functions call the correct endpoints
 * and parse/propagate responses properly.
 */

import {
  fetchLessons,
  fetchLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  fetchLessonCards,
  addCardToLesson,
  removeCardFromLesson,
  reorderLessonCards,
} from '../../api/lessons';

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

describe('fetchLessons', () => {
  it('calls GET /lessons and returns json', async () => {
    const data = [{ id: 1, title: 'L1', sort_order: 1 }];
    mockFetch(200, data);
    const result = await fetchLessons();
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/lessons`);
    expect(result).toEqual(data);
  });

  it('throws on non-ok response', async () => {
    mockFetch(500, { error: 'db error' });
    await expect(fetchLessons()).rejects.toThrow('Failed to fetch lessons: 500');
  });
});

describe('fetchLesson', () => {
  it('calls GET /lessons/:id', async () => {
    const lesson = { id: 3, title: 'L3', sort_order: 3 };
    mockFetch(200, lesson);
    const result = await fetchLesson(3);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/lessons/3`);
    expect(result).toEqual(lesson);
  });

  it('throws on 404', async () => {
    mockFetch(404, { error: 'not found' });
    await expect(fetchLesson(99)).rejects.toThrow('Failed to fetch lesson: 404');
  });
});

describe('createLesson', () => {
  it('calls POST /lessons with title and returns created lesson', async () => {
    const lesson = { id: 10, title: 'New', sort_order: 1 };
    mockFetch(201, lesson);
    const result = await createLesson('New');
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/lessons`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'New' }),
      })
    );
    expect(result).toEqual(lesson);
  });
});

describe('updateLesson', () => {
  it('calls PUT /lessons/:id with new title', async () => {
    const lesson = { id: 5, title: 'Updated', sort_order: 2 };
    mockFetch(200, lesson);
    const result = await updateLesson(5, 'Updated');
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/lessons/5`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      })
    );
    expect(result).toEqual(lesson);
  });

  it('includes description in the request body when provided', async () => {
    const lesson = { id: 5, title: 'Updated', sort_order: 2, description: 'About this lesson' };
    mockFetch(200, lesson);
    await updateLesson(5, 'Updated', 'About this lesson');
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/lessons/5`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated', description: 'About this lesson' }),
      })
    );
  });

  it('throws on non-ok response', async () => {
    mockFetch(500, { error: 'db error' });
    await expect(updateLesson(5, 'Updated')).rejects.toThrow('Failed to update lesson: 500');
  });
});

describe('reorderLessonCards', () => {
  it('calls PUT /lessons/:id/cards/reorder with cardIds array', async () => {
    mockFetch(200, { success: true });
    await reorderLessonCards(1, [3, 1, 2]);
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/lessons/1/cards/reorder`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ cardIds: [3, 1, 2] }),
      })
    );
  });

  it('works with a single-card list', async () => {
    mockFetch(200, { success: true });
    await reorderLessonCards(7, [42]);
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/lessons/7/cards/reorder`,
      expect.objectContaining({
        body: JSON.stringify({ cardIds: [42] }),
      })
    );
  });

  it('throws on non-ok response', async () => {
    mockFetch(400, { error: 'cardIds must be an array' });
    await expect(reorderLessonCards(1, [1, 2])).rejects.toThrow('Failed to reorder lesson cards: 400');
  });
});

describe('deleteLesson', () => {
  it('calls DELETE /lessons/:id', async () => {
    mockFetch(200, { success: true });
    await deleteLesson(7);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/lessons/7`, { method: 'DELETE' });
  });

  it('throws on failure', async () => {
    mockFetch(500, { error: 'fail' });
    await expect(deleteLesson(7)).rejects.toThrow('Failed to delete lesson: 500');
  });
});

describe('fetchLessonCards', () => {
  it('calls GET /lessons/:id/cards', async () => {
    const cards = [{ id: 1, type: 'new_letter', title: 'ა', sort_order: 1 }];
    mockFetch(200, cards);
    const result = await fetchLessonCards(2);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/lessons/2/cards`);
    expect(result).toEqual(cards);
  });
});

describe('addCardToLesson', () => {
  it('calls POST /lessons/:id/cards/:cardId', async () => {
    mockFetch(201, { success: true });
    await addCardToLesson(1, 4);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/lessons/1/cards/4`, { method: 'POST' });
  });
});

describe('removeCardFromLesson', () => {
  it('calls DELETE /lessons/:id/cards/:cardId', async () => {
    mockFetch(200, { success: true });
    await removeCardFromLesson(1, 4);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/lessons/1/cards/4`, { method: 'DELETE' });
  });
});
