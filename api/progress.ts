import { API_BASE as BASE } from './config';

export type ProgressEntry = { id: number; sort_order: number };

export async function fetchUserProgress(userId: number): Promise<ProgressEntry[]> {
  const res = await fetch(`${BASE}/users/${userId}/progress`);
  if (!res.ok) throw new Error(`Failed to fetch progress: ${res.status}`);
  return res.json();
}

export async function markLessonComplete(userId: number, lessonId: number): Promise<void> {
  const res = await fetch(`${BASE}/users/${userId}/progress/${lessonId}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to save progress: ${res.status}`);
}

export async function fetchCardProgress(userId: number, lessonId: number): Promise<number[]> {
  const res = await fetch(`${BASE}/users/${userId}/card-progress/${lessonId}`);
  if (!res.ok) throw new Error(`Failed to fetch card progress: ${res.status}`);
  return res.json();
}

export async function markCardComplete(userId: number, cardId: number): Promise<void> {
  const res = await fetch(`${BASE}/users/${userId}/card-progress/${cardId}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to save card progress: ${res.status}`);
}
