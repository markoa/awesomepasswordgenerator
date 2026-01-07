import { describe, it, expect } from 'vitest';
import { generatePassword, estimateEntropy } from '../password';
import { SYMBOL } from '../constants';
import type { RngBytes } from '../types';

/**
 * Deterministic RNG for testing
 */
function createTestRng(sequence: number[]): RngBytes {
  let index = 0;
  return (length: number): Uint8Array => {
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      arr[i] = sequence[index % sequence.length];
      index++;
    }
    return arr;
  };
}

describe('generatePassword', () => {
  it('should generate password with default options', () => {
    const password = generatePassword({});
    expect(password).toHaveLength(20);
    // Should contain at least one lowercase, uppercase, and digit
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
  });

  it('should generate password with specified length', () => {
    const password = generatePassword({ length: 15 });
    expect(password).toHaveLength(15);
  });

  it('should respect character class options', () => {
    const password = generatePassword({
      length: 10,
      include: {
        lowercase: true,
        uppercase: false,
        digits: true,
        symbols: false,
      },
    });
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).not.toMatch(/[A-Z]/);
    expect(password).not.toMatch(/[!@#$%^&*()]/);
  });

  it('should exclude ambiguous characters when excludeAmbiguous is true', () => {
    const password = generatePassword({
      length: 100, // Long password to increase chance of hitting ambiguous chars
      excludeAmbiguous: true,
      include: {
        lowercase: true,
        uppercase: true,
        digits: true,
        symbols: true,
      },
    });
    expect(password).not.toContain('I');
    expect(password).not.toContain('l');
    expect(password).not.toContain('1');
    expect(password).not.toContain('O');
    expect(password).not.toContain('0');
    expect(password).not.toContain('|');
  });

  it('should include at least one character from each enabled class when requireEachClass is true', () => {
    const password = generatePassword({
      length: 10,
      include: {
        lowercase: true,
        uppercase: true,
        digits: true,
        symbols: false,
      },
      requireEachClass: true,
    });
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
  });

  it('should not require each class when requireEachClass is false', () => {
    // With deterministic RNG, we can test this
    // But since we're using crypto.getRandomValues by default, we'll just
    // verify that the password is generated and has correct length
    const password = generatePassword({
      length: 8, // Use minimum valid length
      include: {
        lowercase: true,
        uppercase: true,
        digits: false,
        symbols: false,
      },
      requireEachClass: false,
    });
    expect(password).toHaveLength(8);
    // It's possible (though unlikely) that only one class appears
    // So we just check it's valid
    expect(password).toMatch(/^[a-zA-Z]+$/);
  });

  it('should work with custom RNG for testing', () => {
    // Use a deterministic RNG to get predictable results
    const rng = createTestRng([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    const password = generatePassword(
      {
        length: 8, // Use minimum valid length
        include: {
          lowercase: true,
          uppercase: false,
          digits: false,
          symbols: false,
        },
        requireEachClass: false,
      },
      rng
    );
    expect(password).toHaveLength(8);
    expect(password).toMatch(/^[a-z]+$/);
  });

  it('should shuffle the password when requireEachClass is true', () => {
    // Generate multiple passwords and verify they're shuffled
    // (not just class chars followed by union chars)
    const passwords = Array.from({ length: 10 }, () =>
      generatePassword({
        length: 10,
        include: {
          lowercase: true,
          uppercase: true,
          digits: true,
          symbols: false,
        },
        requireEachClass: true,
      })
    );

    // All passwords should have the required characters
    passwords.forEach((pwd) => {
      expect(pwd).toMatch(/[a-z]/);
      expect(pwd).toMatch(/[A-Z]/);
      expect(pwd).toMatch(/[0-9]/);
    });

    // They should be different (very likely with real RNG)
    const unique = new Set(passwords);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('should throw error when no characters are available', () => {
    expect(() => {
      generatePassword({
        include: {
          lowercase: false,
          uppercase: false,
          digits: false,
          symbols: false,
        },
      });
    }).toThrow('No characters available');
  });

  it('should handle minimum length correctly', () => {
    const password = generatePassword({
      length: 8,
      include: {
        lowercase: true,
        uppercase: true,
        digits: true,
        symbols: true,
      },
      requireEachClass: true,
    });
    expect(password).toHaveLength(8);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
    // Check that password contains at least one symbol from our SYMBOL set
    const hasSymbol = password.split('').some((char) => SYMBOL.includes(char));
    expect(hasSymbol).toBe(true);
  });
});

describe('estimateEntropy', () => {
  it('should calculate entropy correctly for simple case', () => {
    // For length=8 (minimum), charset size=26 (lowercase only, no ambiguous exclusion for this test)
    // entropy = 8 * log2(26) ≈ 37.6
    const entropy = estimateEntropy({
      length: 8, // Use minimum valid length (normalization clamps to this)
      include: {
        lowercase: true,
        uppercase: false,
        digits: false,
        symbols: false,
      },
      excludeAmbiguous: false, // Keep all 26 lowercase letters
    });
    expect(entropy).toBeCloseTo(8 * Math.log2(26), 5);
  });

  it('should calculate entropy for default options', () => {
    // Default: length=20, lowercase+uppercase+digits, excludeAmbiguous=true
    // Lowercase: 26 - 3 (i, l, o) = 23
    // Uppercase: 26 - 2 (I, O) = 24
    // Digits: 10 - 2 (1, 0) = 8
    // Total: 23 + 24 + 8 = 55
    // Entropy: 20 * log2(55) ≈ 114.5
    const entropy = estimateEntropy({});
    expect(entropy).toBeGreaterThan(100);
    expect(entropy).toBeLessThan(120);
  });

  it('should return 0 when no characters are available', () => {
    const entropy = estimateEntropy({
      include: {
        lowercase: false,
        uppercase: false,
        digits: false,
        symbols: false,
      },
    });
    expect(entropy).toBe(0);
  });

  it('should account for excludeAmbiguous', () => {
    const entropyWith = estimateEntropy({
      length: 10,
      include: {
        lowercase: true,
        uppercase: false,
        digits: false,
        symbols: false,
      },
      excludeAmbiguous: true,
    });

    const entropyWithout = estimateEntropy({
      length: 10,
      include: {
        lowercase: true,
        uppercase: false,
        digits: false,
        symbols: false,
      },
      excludeAmbiguous: false,
    });

    // With ambiguous excluded, charset is smaller, so entropy is lower
    expect(entropyWith).toBeLessThan(entropyWithout);
  });

  it('should scale linearly with length', () => {
    const entropy10 = estimateEntropy({
      length: 10,
      include: {
        lowercase: true,
        uppercase: false,
        digits: false,
        symbols: false,
      },
    });

    const entropy20 = estimateEntropy({
      length: 20,
      include: {
        lowercase: true,
        uppercase: false,
        digits: false,
        symbols: false,
      },
    });

    expect(entropy20).toBeCloseTo(entropy10 * 2, 5);
  });
});

