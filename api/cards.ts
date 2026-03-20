import { API_BASE as BASE } from './config';

export type Card =
  | 'new_letter' | 'sound_story' | 'letter_writing' | 'word_reading'
  | 'book' | 'letter_review' | 'alphabet_song' | 'quick_check' | 'comprehension';

export type CardData = {
  id: number;
  lesson_id: number;
  type: Card;
  sort_order: number;
  title: string | null;
  content: Record<string, any>;
  created_at: string;
};

function parseContent(card: any): CardData {
  if (typeof card.content === 'string') {
    try { card.content = JSON.parse(card.content); } catch { card.content = {}; }
  }
  return card;
}

export async function fetchCard(id: number): Promise<CardData> {
  const res = await fetch(`${BASE}/cards/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch card: ${res.status}`);
  return parseContent(await res.json());
}

export async function fetchCards(): Promise<CardData[]> {
  const res = await fetch(`${BASE}/cards`);
  if (!res.ok) throw new Error(`Failed to fetch cards: ${res.status}`);
  return (await res.json()).map(parseContent);
}

export async function createCard(data: {
  type: Card;
  title?: string;
  content?: Record<string, any>;
}): Promise<CardData> {
  const res = await fetch(`${BASE}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create card: ${res.status}`);
  return res.json();
}

export async function updateCard(id: number, data: {
  title?: string;
  content?: Record<string, any>;
  sort_order?: number;
}): Promise<CardData> {
  const res = await fetch(`${BASE}/cards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update card: ${res.status}`);
  return res.json();
}

export async function deleteCard(id: number): Promise<void> {
  const res = await fetch(`${BASE}/cards/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete card: ${res.status}`);
}
