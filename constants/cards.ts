import { type Card } from '../api/cards';

export type FieldDef = { key: string; label: string; multiline?: boolean };

export type PageDraft = { text: string; image: string };

export const CARD_TYPES: { key: Card; label: string; emoji: string; color: string }[] = [
  { key: 'new_letter',     label: 'ახალი ასო',           emoji: '🔤', color: '#6366F1' },
  { key: 'sound_story',    label: 'ბგერის ისტორია',      emoji: '🔊', color: '#EC4899' },
  { key: 'letter_writing', label: 'ასოს წერა',           emoji: '✍️',  color: '#F59E0B' },
  { key: 'word_reading',   label: 'სიტყვის კითხვა',      emoji: '📖', color: '#10B981' },
  { key: 'book',           label: 'წიგნი',               emoji: '📚', color: '#3B82F6' },
  { key: 'letter_review',  label: 'ასოების გამეორება',   emoji: '🔁', color: '#8B5CF6' },
  { key: 'alphabet_song',  label: 'ანბანის სიმღერა',     emoji: '🎵', color: '#EF4444' },
  { key: 'quick_check',    label: 'სწრაფი შემოწმება',    emoji: '✅', color: '#14B8A6' },
  { key: 'comprehension',  label: 'გაგება-გააზრება',     emoji: '🧠', color: '#F97316' },
];

export const CONTENT_FIELDS: Record<Card, FieldDef[]> = {
  new_letter:     [{ key: 'letter', label: 'ასო' }, { key: 'example_word', label: 'სიტყვის მაგალითი' }],
  sound_story:    [{ key: 'text', label: 'ტექსტი', multiline: true }],
  letter_writing: [{ key: 'letter', label: 'ასო' }, { key: 'instructions', label: 'ინსტრუქცია', multiline: true }],
  word_reading:   [{ key: 'words', label: 'სიტყვები (ყოველი ხაზზე)', multiline: true }],
  book:           [],
  letter_review:  [{ key: 'letters', label: 'ასოები (მძიმით გამოყოფილი)' }],
  alphabet_song:  [{ key: 'lyrics', label: 'სიტყვები', multiline: true }],
  quick_check:    [{ key: 'questions', label: 'კითხვები (JSON)', multiline: true }],
  comprehension:  [{ key: 'passage', label: 'ტექსტი', multiline: true }, { key: 'questions', label: 'კითხვები (JSON)', multiline: true }],
};

export function parseBookPages(content: Record<string, any>): PageDraft[] {
  if (Array.isArray(content.pages)) {
    return content.pages.map((p: any) => ({ text: p.text ?? '', image: p.image ?? '' }));
  }
  if (content.content != null) return [{ text: String(content.content), image: '' }];
  return [{ text: '', image: '' }];
}

export function contentToFieldValues(type: Card, content: Record<string, any>): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of CONTENT_FIELDS[type]) {
    const val = content[field.key];
    if (field.key === 'words' && Array.isArray(val)) {
      values[field.key] = val.join('\n');
    } else if (field.key === 'letters' && Array.isArray(val)) {
      values[field.key] = val.join(', ');
    } else if (field.key === 'questions') {
      values[field.key] = val != null ? JSON.stringify(val, null, 2) : '';
    } else {
      values[field.key] = val != null ? String(val) : '';
    }
  }
  return values;
}

// ─── New Letter sections ──────────────────────────────────────────────────────

export const NEW_LETTER_SECTIONS = [
  { key: 'instruction_video', defaultTitle: 'ინსტრუქციის ვიდეო',              hasVideo: true  },
  { key: 'intro_video',       defaultTitle: 'ახალი ასოს ვიდეო',               hasVideo: true  },
  { key: 'say_sound_parent',  defaultTitle: 'წარმოთქვი ბგერა (მშობლისთვის)', hasVideo: false },
  { key: 'say_sound_kid',     defaultTitle: 'წარმოთქვი ბგერა (ბავშვისთვის)', hasVideo: false },
  { key: 'what_letter',       defaultTitle: 'რომელი ასოა?',                   hasVideo: false },
] as const;

export type NLSection = { hidden: boolean; title: string; video_url?: string };

export function getDefaultNLSections(): Record<string, NLSection> {
  return Object.fromEntries(
    NEW_LETTER_SECTIONS.map(s => [
      s.key,
      { hidden: false, title: s.defaultTitle, ...(s.hasVideo ? { video_url: '' } : {}) },
    ])
  );
}

export function buildContent(type: Card, values: Record<string, string>): Record<string, any> {
  const content: Record<string, any> = {};
  for (const field of CONTENT_FIELDS[type]) {
    const raw = values[field.key] ?? '';
    if (field.key === 'words') {
      content[field.key] = raw.split('\n').map((w: string) => w.trim()).filter(Boolean);
    } else if (field.key === 'letters') {
      content[field.key] = raw.split(',').map((l: string) => l.trim()).filter(Boolean);
    } else if (field.key === 'questions') {
      try { content[field.key] = JSON.parse(raw); } catch { content[field.key] = raw; }
    } else {
      content[field.key] = raw;
    }
  }
  return content;
}
