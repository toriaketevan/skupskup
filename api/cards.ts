const BASE = 'http://localhost:3001';

export type CardType =
  | 'new_letter' | 'sound_story' | 'letter_writing' | 'word_reading'
  | 'book' | 'letter_review' | 'alphabet_song' | 'quick_check' | 'comprehension';

export type Card = {
  id: number;
  lesson_id: number;
  type: CardType;
  sort_order: number;
  title: string | null;
  content: Record<string, any>;
  created_at: string;
};

export async function fetchCards(): Promise<Card[]> {
  const res = await fetch(`${BASE}/cards`);
  if (!res.ok) throw new Error(`Failed to fetch cards: ${res.status}`);
  return res.json();
}

export async function createCard(data: {
  type: CardType;
  title?: string;
  content?: Record<string, any>;
}): Promise<Card> {
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
}): Promise<Card> {
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
