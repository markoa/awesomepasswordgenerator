import { describe, it, expect } from 'vitest';
import { WORDLIST, getWordlistSize } from '../wordlist';

describe('WORDLIST', () => {
  it('should have reasonable size (at least 2000 words)', () => {
    expect(WORDLIST.length).toBeGreaterThanOrEqual(2000);
    expect(getWordlistSize()).toBe(WORDLIST.length);
  });

  it('should contain only non-empty strings', () => {
    WORDLIST.forEach((word) => {
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
    });
  });

  it('should contain only lowercase words', () => {
    WORDLIST.forEach((word) => {
      expect(word).toBe(word.toLowerCase());
    });
  });

  it('should not contain duplicates', () => {
    const unique = new Set(WORDLIST);
    expect(unique.size).toBe(WORDLIST.length);
  });

  it('should contain expected sample words', () => {
    // Check for words that are likely to be in a common wordlist
    const samples = ['abandon', 'ability', 'about', 'above', 'action', 'animal'];
    samples.forEach((sample) => {
      expect(WORDLIST).toContain(sample);
    });
  });

  it('should have words of reasonable length', () => {
    WORDLIST.forEach((word) => {
      // Words should be between 1 and 20 characters (reasonable for passphrases)
      expect(word.length).toBeGreaterThanOrEqual(1);
      expect(word.length).toBeLessThanOrEqual(20);
    });
  });

  it('should not contain special characters or spaces', () => {
    WORDLIST.forEach((word) => {
      expect(word).toMatch(/^[a-z]+$/);
    });
  });
});

