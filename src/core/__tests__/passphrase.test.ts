import { describe, it, expect } from 'vitest';
import { generatePassphrase } from '../passphrase';
import { DEFAULT_PASSPHRASE_WORD_COUNT, DEFAULT_PASSPHRASE_SEPARATOR } from '../constants';

describe('generatePassphrase', () => {
  it('should generate a passphrase with default options', () => {
    const result = generatePassphrase({});
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should generate passphrase with specified word count', () => {
    const result = generatePassphrase({ wordCount: 4 });
    const words = result.split(DEFAULT_PASSPHRASE_SEPARATOR);
    expect(words.length).toBe(4);
  });

  it('should use custom separator', () => {
    const separator = '_';
    const result = generatePassphrase({ separator, wordCount: 3 });
    expect(result).toContain(separator);
    expect(result.split(separator).length).toBe(3);
  });

  it('should capitalize first letter of each word when capitalization is "first"', () => {
    const result = generatePassphrase({
      wordCount: 3,
      capitalization: 'first',
    });
    const words = result.split(DEFAULT_PASSPHRASE_SEPARATOR);
    words.forEach((word) => {
      if (word.length > 0 && /^[a-z]/.test(word[0])) {
        expect(word[0]).toBe(word[0].toUpperCase());
      }
    });
  });

  it('should randomly capitalize one word when capitalization is "random"', () => {
    const result = generatePassphrase({
      wordCount: 5,
      capitalization: 'random',
    });
    const words = result.split(DEFAULT_PASSPHRASE_SEPARATOR);
    const hasCapitalized = words.some((word) => /^[A-Z]/.test(word));
    expect(hasCapitalized).toBe(true);
  });

  it('should add digits when addDigit is true', () => {
    const result = generatePassphrase({ wordCount: 3, addDigit: true });
    expect(/\d{2}$/.test(result)).toBe(true);
  });

  it('should add symbol when addSymbol is true', () => {
    const result = generatePassphrase({ wordCount: 3, addSymbol: true });
    const lastChar = result[result.length - 1];
    expect(/[!@#$%^&*()-_=+\[\]{};:,.?]/.test(lastChar)).toBe(true);
  });

  it('should add both digit and symbol when both are enabled', () => {
    const result = generatePassphrase({
      wordCount: 3,
      addDigit: true,
      addSymbol: true,
    });
    expect(/\d{2}[!@#$%^&*()-_=+\[\]{};:,.?]$/.test(result)).toBe(true);
  });

  it('should throw error for invalid word count', () => {
    expect(() => {
      generatePassphrase({ wordCount: 2 });
    }).toThrow();
  });

  it('should throw error for word count above maximum', () => {
    expect(() => {
      generatePassphrase({ wordCount: 11 });
    }).toThrow();
  });

  it('should generate different passphrases on multiple calls', () => {
    const results = new Set();
    for (let i = 0; i < 10; i++) {
      results.add(generatePassphrase({ wordCount: 4 }));
    }
    // Very unlikely all 10 would be the same
    expect(results.size).toBeGreaterThan(1);
  });

  it('should handle empty separator correctly', () => {
    const result = generatePassphrase({ wordCount: 3, separator: '' });
    // With empty separator, words should be concatenated
    expect(result.length).toBeGreaterThan(0);
    // Should not contain the default separator
    expect(result).not.toContain(DEFAULT_PASSPHRASE_SEPARATOR);
  });

  it('should handle space separator', () => {
    const result = generatePassphrase({ wordCount: 3, separator: ' ' });
    const words = result.split(' ');
    expect(words.length).toBe(3);
  });

  it('should handle all capitalization modes correctly', () => {
    const modes: Array<'none' | 'first' | 'random'> = ['none', 'first', 'random'];
    modes.forEach((mode) => {
      const result = generatePassphrase({
        wordCount: 4,
        capitalization: mode,
      });
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  it('should generate passphrase with maximum word count', () => {
    const result = generatePassphrase({ wordCount: 10 });
    const words = result.split(DEFAULT_PASSPHRASE_SEPARATOR);
    expect(words.length).toBe(10);
  });

  it('should generate passphrase with minimum word count', () => {
    const result = generatePassphrase({ wordCount: 3 });
    const words = result.split(DEFAULT_PASSPHRASE_SEPARATOR);
    expect(words.length).toBe(3);
  });
});

