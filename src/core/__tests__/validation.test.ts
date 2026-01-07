import { describe, it, expect } from 'vitest';
import {
  validatePasswordOptions,
  normalizePasswordOptions,
  validatePassphraseOptions,
  normalizePassphraseOptions,
} from '../validation';
import {
  PASSWORD_LENGTH_MIN,
  PASSWORD_LENGTH_MAX,
  PASSPHRASE_WORD_COUNT_MIN,
  PASSPHRASE_WORD_COUNT_MAX,
  DEFAULT_PASSWORD_LENGTH,
  DEFAULT_PASSPHRASE_WORD_COUNT,
  DEFAULT_PASSPHRASE_SEPARATOR,
} from '../constants';

describe('validatePasswordOptions', () => {
  it('should validate correct options', () => {
    const result = validatePasswordOptions({
      length: 20,
      include: {
        lowercase: true,
        uppercase: true,
        digits: true,
        symbols: false,
      },
      requireEachClass: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should reject length below minimum', () => {
    const result = validatePasswordOptions({
      length: PASSWORD_LENGTH_MIN - 1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject length above maximum', () => {
    const result = validatePasswordOptions({
      length: PASSWORD_LENGTH_MAX + 1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject non-integer length', () => {
    const result = validatePasswordOptions({
      length: 20.5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Length must be an integer');
  });

  it('should reject when no character classes are enabled', () => {
    const result = validatePasswordOptions({
      length: 20,
      include: {
        lowercase: false,
        uppercase: false,
        digits: false,
        symbols: false,
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one character class must be enabled');
  });

  it('should reject when requireEachClass is true but length is too short', () => {
    const result = validatePasswordOptions({
      length: 2,
      include: {
        lowercase: true,
        uppercase: true,
        digits: true,
        symbols: false,
      },
      requireEachClass: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('normalizePasswordOptions', () => {
  it('should apply defaults from SPEC §5.1', () => {
    const normalized = normalizePasswordOptions({});
    expect(normalized.length).toBe(DEFAULT_PASSWORD_LENGTH);
    expect(normalized.include.lowercase).toBe(true);
    expect(normalized.include.uppercase).toBe(true);
    expect(normalized.include.digits).toBe(true);
    expect(normalized.include.symbols).toBe(false);
    expect(normalized.excludeAmbiguous).toBe(true);
    expect(normalized.requireEachClass).toBe(true);
  });

  it('should clamp length to valid bounds', () => {
    const tooShort = normalizePasswordOptions({ length: 5 });
    expect(tooShort.length).toBe(PASSWORD_LENGTH_MIN);

    const tooLong = normalizePasswordOptions({ length: 200 });
    expect(tooLong.length).toBe(PASSWORD_LENGTH_MAX);
  });

  it('should round non-integer lengths', () => {
    const normalized = normalizePasswordOptions({ length: 20.7 });
    expect(normalized.length).toBe(21);
  });

  it('should preserve provided options', () => {
    const normalized = normalizePasswordOptions({
      length: 25,
      include: {
        lowercase: true,
        uppercase: false,
        digits: true,
        symbols: true,
      },
      excludeAmbiguous: false,
      requireEachClass: false,
    });
    expect(normalized.length).toBe(25);
    expect(normalized.include.uppercase).toBe(false);
    expect(normalized.include.symbols).toBe(true);
    expect(normalized.excludeAmbiguous).toBe(false);
    expect(normalized.requireEachClass).toBe(false);
  });

  it('should merge partial include objects with defaults', () => {
    // Only provide lowercase, others should default
    const normalized = normalizePasswordOptions({
      include: {
        lowercase: true,
        uppercase: undefined,
        digits: undefined,
        symbols: undefined,
      } as any, // Partial object for testing
    });
    expect(normalized.include.lowercase).toBe(true);
    expect(normalized.include.uppercase).toBe(true); // default
    expect(normalized.include.digits).toBe(true); // default
    expect(normalized.include.symbols).toBe(false); // default

    // Provide only symbols: true, others should default
    const normalized2 = normalizePasswordOptions({
      include: {
        symbols: true,
        lowercase: undefined,
        uppercase: undefined,
        digits: undefined,
      } as any, // Partial object for testing
    });
    expect(normalized2.include.lowercase).toBe(true); // default
    expect(normalized2.include.uppercase).toBe(true); // default
    expect(normalized2.include.digits).toBe(true); // default
    expect(normalized2.include.symbols).toBe(true); // provided
  });
});

describe('validatePassphraseOptions', () => {
  it('should validate correct options', () => {
    const result = validatePassphraseOptions({
      wordCount: 5,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should reject word count below minimum', () => {
    const result = validatePassphraseOptions({
      wordCount: PASSPHRASE_WORD_COUNT_MIN - 1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject word count above maximum', () => {
    const result = validatePassphraseOptions({
      wordCount: PASSPHRASE_WORD_COUNT_MAX + 1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject non-integer word count', () => {
    const result = validatePassphraseOptions({
      wordCount: 5.5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Word count must be an integer');
  });
});

describe('normalizePassphraseOptions', () => {
  it('should apply defaults from SPEC §5.2', () => {
    const normalized = normalizePassphraseOptions({});
    expect(normalized.wordCount).toBe(DEFAULT_PASSPHRASE_WORD_COUNT);
    expect(normalized.separator).toBe(DEFAULT_PASSPHRASE_SEPARATOR);
    expect(normalized.capitalization).toBe('none');
    expect(normalized.addDigit).toBe(false);
    expect(normalized.addSymbol).toBe(false);
  });

  it('should clamp word count to valid bounds', () => {
    const tooShort = normalizePassphraseOptions({ wordCount: 1 });
    expect(tooShort.wordCount).toBe(PASSPHRASE_WORD_COUNT_MIN);

    const tooLong = normalizePassphraseOptions({ wordCount: 20 });
    expect(tooLong.wordCount).toBe(PASSPHRASE_WORD_COUNT_MAX);
  });

  it('should round non-integer word counts', () => {
    const normalized = normalizePassphraseOptions({ wordCount: 5.7 });
    expect(normalized.wordCount).toBe(6);
  });

  it('should preserve provided options', () => {
    const normalized = normalizePassphraseOptions({
      wordCount: 7,
      separator: '_',
      capitalization: 'first',
      addDigit: true,
      addSymbol: true,
    });
    expect(normalized.wordCount).toBe(7);
    expect(normalized.separator).toBe('_');
    expect(normalized.capitalization).toBe('first');
    expect(normalized.addDigit).toBe(true);
    expect(normalized.addSymbol).toBe(true);
  });

  it('should handle empty separator', () => {
    const normalized = normalizePassphraseOptions({ separator: '' });
    expect(normalized.separator).toBe('');
  });
});
