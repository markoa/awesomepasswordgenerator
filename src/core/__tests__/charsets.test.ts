import { describe, it, expect } from 'vitest';
import { buildCharset, getClassCharsets } from '../charsets';
import type { CharacterClassOptions } from '../types';

describe('buildCharset', () => {
  it('should build charset with all classes enabled', () => {
    const include: CharacterClassOptions = {
      lowercase: true,
      uppercase: true,
      digits: true,
      symbols: true,
    };
    const charset = buildCharset(include, false);
    expect(charset).toContain('a');
    expect(charset).toContain('A');
    expect(charset).toContain('0');
    expect(charset).toContain('!');
  });

  it('should exclude ambiguous characters when excludeAmbiguous is true', () => {
    const include: CharacterClassOptions = {
      lowercase: true,
      uppercase: true,
      digits: true,
      symbols: true,
    };
    const charset = buildCharset(include, true);
    expect(charset).not.toContain('I');
    expect(charset).not.toContain('l');
    expect(charset).not.toContain('1');
    expect(charset).not.toContain('O');
    expect(charset).not.toContain('0');
    expect(charset).not.toContain('|');
  });

  it('should exclude | only when symbols are enabled and excludeAmbiguous is true', () => {
    const includeWithSymbols: CharacterClassOptions = {
      lowercase: true,
      uppercase: false,
      digits: false,
      symbols: true,
    };
    const charsetWithSymbols = buildCharset(includeWithSymbols, true);
    expect(charsetWithSymbols).not.toContain('|');

    const includeWithoutSymbols: CharacterClassOptions = {
      lowercase: true,
      uppercase: false,
      digits: false,
      symbols: false,
    };
    // When symbols are disabled, | shouldn't be in the charset anyway
    const charsetWithoutSymbols = buildCharset(includeWithoutSymbols, true);
    expect(charsetWithoutSymbols).not.toContain('|');
  });

  it('should only include selected classes', () => {
    const include: CharacterClassOptions = {
      lowercase: true,
      uppercase: false,
      digits: true,
      symbols: false,
    };
    const charset = buildCharset(include, false);
    expect(charset).toContain('a');
    expect(charset).toContain('0');
    expect(charset).not.toContain('A');
    expect(charset).not.toContain('!');
  });

  it('should return empty string when no classes are enabled', () => {
    const include: CharacterClassOptions = {
      lowercase: false,
      uppercase: false,
      digits: false,
      symbols: false,
    };
    const charset = buildCharset(include, false);
    expect(charset).toBe('');
  });
});

describe('getClassCharsets', () => {
  it('should return separate charsets for each enabled class', () => {
    const include: CharacterClassOptions = {
      lowercase: true,
      uppercase: true,
      digits: true,
      symbols: false,
    };
    const charsets = getClassCharsets(include, false);
    expect(charsets).toHaveLength(3);
    expect(charsets[0]).toMatch(/^[a-z]+$/);
    expect(charsets[1]).toMatch(/^[A-Z]+$/);
    expect(charsets[2]).toMatch(/^[0-9]+$/);
  });

  it('should exclude ambiguous characters from individual sets', () => {
    const include: CharacterClassOptions = {
      lowercase: true,
      uppercase: true,
      digits: true,
      symbols: true,
    };
    const charsets = getClassCharsets(include, true);
    
    // Check that ambiguous chars are removed
    for (const charset of charsets) {
      expect(charset).not.toContain('I');
      expect(charset).not.toContain('l');
      expect(charset).not.toContain('1');
      expect(charset).not.toContain('O');
      expect(charset).not.toContain('0');
    }
    
    // Symbols set should not contain |
    const symbolsSet = charsets.find((s) => s.includes('!'));
    if (symbolsSet) {
      expect(symbolsSet).not.toContain('|');
    }
  });

  it('should only return sets for enabled classes', () => {
    const include: CharacterClassOptions = {
      lowercase: true,
      uppercase: false,
      digits: false,
      symbols: true,
    };
    const charsets = getClassCharsets(include, false);
    expect(charsets).toHaveLength(2);
    expect(charsets[0]).toMatch(/^[a-z]+$/);
    expect(charsets[1]).toContain('!');
  });

  it('should return empty array when no classes are enabled', () => {
    const include: CharacterClassOptions = {
      lowercase: false,
      uppercase: false,
      digits: false,
      symbols: false,
    };
    const charsets = getClassCharsets(include, false);
    expect(charsets).toEqual([]);
  });
});

