// On iOS simulator and web, localhost works.
// On Android emulator use 10.0.2.2 instead.
const BASE = 'http://localhost:3001';

export type Lesson = {
  id: number;
  title: string;
  sort_order: number;
  description?: string | null;
};

export async function fetchLessons(): Promise<Lesson[]> {
  const res = await fetch(`${BASE}/lessons`);
  if (!res.ok) throw new Error(`Failed to fetch lessons: ${res.status}`);
  return res.json();
}

export async function createLesson(title: string): Promise<Lesson> {
  const res = await fetch(`${BASE}/lessons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed to create lesson: ${res.status}`);
  return res.json();
}

export async function updateLesson(id: number, title: string, description?: string): Promise<Lesson> {
  const res = await fetch(`${BASE}/lessons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) throw new Error(`Failed to update lesson: ${res.status}`);
  return res.json();
}

export async function deleteLesson(id: number): Promise<void> {
  const res = await fetch(`${BASE}/lessons/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete lesson: ${res.status}`);
}

export async function fetchLesson(id: number): Promise<Lesson> {
  const res = await fetch(`${BASE}/lessons/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch lesson: ${res.status}`);
  return res.json();
}

export async function fetchLessonCards(lessonId: number): Promise<any[]> {
  const res = await fetch(`${BASE}/lessons/${lessonId}/cards`);
  if (!res.ok) throw new Error(`Failed to fetch lesson cards: ${res.status}`);
  return res.json();
}

export async function addCardToLesson(lessonId: number, cardId: number): Promise<void> {
  const res = await fetch(`${BASE}/lessons/${lessonId}/cards/${cardId}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to add card to lesson: ${res.status}`);
}

export async function removeCardFromLesson(lessonId: number, cardId: number): Promise<void> {
  const res = await fetch(`${BASE}/lessons/${lessonId}/cards/${cardId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to remove card from lesson: ${res.status}`);
}

export async function reorderLessonCards(lessonId: number, cardIds: number[]): Promise<void> {
  const res = await fetch(`${BASE}/lessons/${lessonId}/cards/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardIds }),
  });
  if (!res.ok) throw new Error(`Failed to reorder lesson cards: ${res.status}`);
}
