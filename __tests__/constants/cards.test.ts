/**
 * Unit tests for constants/cards.ts helper functions:
 *   parseBookPages, contentToFieldValues, buildContent
 */

import {
  parseBookPages,
  contentToFieldValues,
  buildContent,
} from '../../constants/cards';

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
