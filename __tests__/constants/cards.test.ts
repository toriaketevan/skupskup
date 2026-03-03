/**
 * Unit tests for constants/cards.ts helper functions:
 *   parseBookPages, contentToFieldValues, buildContent
 */

import {
  parseBookPages,
  contentToFieldValues,
  buildContent,
  NEW_LETTER_SECTIONS,
  getDefaultNLSections,
} from '../../constants/cards';

// ─── NEW_LETTER_SECTIONS ───────────────────────────────────────────────────────

describe('NEW_LETTER_SECTIONS', () => {
  it('contains exactly 5 sections', () => {
    expect(NEW_LETTER_SECTIONS).toHaveLength(5);
  });

  it('has the correct keys in order', () => {
    expect(NEW_LETTER_SECTIONS.map(s => s.key)).toEqual([
      'instruction_video',
      'intro_video',
      'say_sound_parent',
      'say_sound_kid',
      'what_letter',
    ]);
  });

  it('marks first two sections as hasVideo true', () => {
    expect(NEW_LETTER_SECTIONS[0].hasVideo).toBe(true);
    expect(NEW_LETTER_SECTIONS[1].hasVideo).toBe(true);
  });

  it('marks last three sections as hasVideo false', () => {
    expect(NEW_LETTER_SECTIONS[2].hasVideo).toBe(false);
    expect(NEW_LETTER_SECTIONS[3].hasVideo).toBe(false);
    expect(NEW_LETTER_SECTIONS[4].hasVideo).toBe(false);
  });

  it('each section has a non-empty defaultTitle', () => {
    for (const s of NEW_LETTER_SECTIONS) {
      expect(typeof s.defaultTitle).toBe('string');
      expect(s.defaultTitle.length).toBeGreaterThan(0);
    }
  });
});

// ─── getDefaultNLSections ──────────────────────────────────────────────────────

describe('getDefaultNLSections', () => {
  it('returns an entry for every section', () => {
    const defaults = getDefaultNLSections();
    for (const s of NEW_LETTER_SECTIONS) {
      expect(defaults).toHaveProperty(s.key);
    }
  });

  it('sets hidden to false for all sections', () => {
    const defaults = getDefaultNLSections();
    for (const s of NEW_LETTER_SECTIONS) {
      expect(defaults[s.key].hidden).toBe(false);
    }
  });

  it('pre-fills title with defaultTitle for each section', () => {
    const defaults = getDefaultNLSections();
    for (const s of NEW_LETTER_SECTIONS) {
      expect(defaults[s.key].title).toBe(s.defaultTitle);
    }
  });

  it('includes video_url (empty string) only for hasVideo sections', () => {
    const defaults = getDefaultNLSections();
    for (const s of NEW_LETTER_SECTIONS) {
      if (s.hasVideo) {
        expect(defaults[s.key]).toHaveProperty('video_url', '');
      } else {
        expect(defaults[s.key]).not.toHaveProperty('video_url');
      }
    }
  });

  it('returns a new object on each call (no shared reference)', () => {
    const a = getDefaultNLSections();
    const b = getDefaultNLSections();
    expect(a).not.toBe(b);
    a['instruction_video'].hidden = true;
    expect(b['instruction_video'].hidden).toBe(false);
  });
});

// ─── parseBookPages ────────────────────────────────────────────────────────────

describe('parseBookPages', () => {
  it('maps pages array to PageDraft objects', () => {
    const result = parseBookPages({
      pages: [
        { text: 'გვერდი 1', image: 'https://img.com/1.jpg' },
        { text: 'გვერდი 2', image: '' },
      ],
    });
    expect(result).toEqual([
      { text: 'გვერდი 1', image: 'https://img.com/1.jpg' },
      { text: 'გვერდი 2', image: '' },
    ]);
  });

  it('fills missing text/image with empty string', () => {
    const result = parseBookPages({ pages: [{ text: 'hi' }] });
    expect(result).toEqual([{ text: 'hi', image: '' }]);
  });

  it('falls back to content field when pages is absent', () => {
    const result = parseBookPages({ content: 'some old text' });
    expect(result).toEqual([{ text: 'some old text', image: '' }]);
  });

  it('returns single empty page when content is empty object', () => {
    const result = parseBookPages({});
    expect(result).toEqual([{ text: '', image: '' }]);
  });

  it('handles empty pages array', () => {
    const result = parseBookPages({ pages: [] });
    expect(result).toEqual([]);
  });
});

// ─── contentToFieldValues ──────────────────────────────────────────────────────

describe('contentToFieldValues', () => {
  it('converts new_letter fields to strings', () => {
    const result = contentToFieldValues('new_letter', {
      letter: 'ა',
      phoneme: 'a',
      example_word: 'ანა',
    });
    expect(result).toEqual({ letter: 'ა', phoneme: 'a', example_word: 'ანა' });
  });

  it('joins words array with newlines for word_reading', () => {
    const result = contentToFieldValues('word_reading', {
      words: ['ანა', 'ბაბა', 'გინა'],
    });
    expect(result.words).toBe('ანა\nბაბა\nგინა');
  });

  it('joins letters array with comma+space for letter_review', () => {
    const result = contentToFieldValues('letter_review', {
      letters: ['ა', 'ბ', 'გ'],
    });
    expect(result.letters).toBe('ა, ბ, გ');
  });

  it('serialises questions to indented JSON for quick_check', () => {
    const qs = [{ q: 'რა?', a: 'კი' }];
    const result = contentToFieldValues('quick_check', { questions: qs });
    expect(result.questions).toBe(JSON.stringify(qs, null, 2));
  });

  it('returns empty string for missing fields', () => {
    const result = contentToFieldValues('new_letter', {});
    expect(result).toEqual({ letter: '', phoneme: '', example_word: '' });
  });

  it('converts null value to empty string', () => {
    const result = contentToFieldValues('sound_story', { text: null });
    expect(result.text).toBe('');
  });

  it('returns empty object for book (no fields)', () => {
    const result = contentToFieldValues('book', { pages: [] });
    expect(result).toEqual({});
  });
});

// ─── buildContent ──────────────────────────────────────────────────────────────

describe('buildContent', () => {
  it('builds new_letter content with string values', () => {
    const result = buildContent('new_letter', {
      letter: 'ბ',
      phoneme: 'b',
      example_word: 'ბაბა',
    });
    expect(result).toEqual({ letter: 'ბ', phoneme: 'b', example_word: 'ბაბა' });
  });

  it('splits words by newline for word_reading', () => {
    const result = buildContent('word_reading', { words: 'ანა\nბაბა\n  გინა  ' });
    expect(result.words).toEqual(['ანა', 'ბაბა', 'გინა']);
  });

  it('filters empty lines for word_reading', () => {
    const result = buildContent('word_reading', { words: 'ანა\n\nბაბა' });
    expect(result.words).toEqual(['ანა', 'ბაბა']);
  });

  it('splits letters by comma for letter_review', () => {
    const result = buildContent('letter_review', { letters: 'ა, ბ, გ' });
    expect(result.letters).toEqual(['ა', 'ბ', 'გ']);
  });

  it('filters empty tokens for letter_review', () => {
    const result = buildContent('letter_review', { letters: 'ა,,ბ' });
    expect(result.letters).toEqual(['ა', 'ბ']);
  });

  it('parses valid JSON for questions field', () => {
    const qs = [{ q: 'კი?', a: 'არა' }];
    const result = buildContent('quick_check', { questions: JSON.stringify(qs) });
    expect(result.questions).toEqual(qs);
  });

  it('keeps raw string when questions JSON is invalid', () => {
    const result = buildContent('quick_check', { questions: 'not json' });
    expect(result.questions).toBe('not json');
  });

  it('uses empty string for missing values', () => {
    const result = buildContent('new_letter', {});
    expect(result).toEqual({ letter: '', phoneme: '', example_word: '' });
  });

  it('returns empty object for book (no fields)', () => {
    const result = buildContent('book', {});
    expect(result).toEqual({});
  });
});
