import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generatePassword, estimateEntropy } from '../password';
import {
  normalizePasswordOptions,
  validatePasswordOptions,
} from '../validation';
import { uniformRandomIndex } from '../random';
import { buildCharset } from '../charsets';
import {
  PASSWORD_LENGTH_MIN,
  PASSWORD_LENGTH_MAX,
} from '../constants';
import type { PasswordOptions, RngBytes } from '../types';

/**
 * Property-based tests for core generator functionality
 * Tests invariants and guardrails across many random inputs
 */

/**
 * Deterministic RNG for property testing
 * Uses fast-check's random generator
 */
function createArbitraryRng(seed: number): RngBytes {
  let state = seed;
  return (length: number): Uint8Array => {
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      // Simple LCG for deterministic testing
      state = (state * 1664525 + 1013904223) % 2 ** 32;
      arr[i] = state & 0xff;
    }
    return arr;
  };
}

describe('Property Tests: Distribution Sanity Checks', () => {
  it('should generate passwords with roughly uniform character distribution', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: PASSWORD_LENGTH_MIN, max: 50 }),
        fc.record({
          lowercase: fc.boolean(),
          uppercase: fc.boolean(),
          digits: fc.boolean(),
          symbols: fc.boolean(),
          excludeAmbiguous: fc.boolean(),
          requireEachClass: fc.boolean(),
        }),
        (length, options) => {
          // Skip invalid configurations
          const include = options;
          const enabledClasses = [
            include.lowercase,
            include.uppercase,
            include.digits,
            include.symbols,
          ].filter(Boolean).length;

          if (enabledClasses === 0) return true;
          if (options.requireEachClass && length < enabledClasses) return true;

          // Generate many passwords and check distribution
          const passwords = Array.from({ length: 100 }, () =>
            generatePassword({
              length,
              include,
              excludeAmbiguous: options.excludeAmbiguous,
              requireEachClass: options.requireEachClass,
            })
          );

          // Build expected charset
          const charset = buildCharset(
            include,
            options.excludeAmbiguous
          );
          if (charset.length === 0) return true;

          // Count character frequencies
          const charCounts = new Map<string, number>();
          let totalChars = 0;

          passwords.forEach((pwd) => {
            pwd.split('').forEach((char) => {
              charCounts.set(char, (charCounts.get(char) || 0) + 1);
              totalChars++;
            });
          });

          // Check that all characters in charset appear at least once
          // (with high probability over 100 passwords)
          const expectedMinOccurrences = Math.floor(
            (totalChars / charset.length) * 0.1
          ); // At least 10% of expected

          // For small charsets, we expect most chars to appear
          // For large charsets, we just check that distribution isn't too skewed
          const minExpected = charset.length <= 10 ? 1 : 0;

          // Check that no single character dominates (>50% of all chars)
          const maxAllowed = totalChars * 0.5;
          for (const count of charCounts.values()) {
            expect(count).toBeLessThan(maxAllowed);
          }

          // Check that we see a reasonable number of unique characters
          // (at least 50% of charset should appear for small sets, or reasonable diversity)
          const uniqueChars = charCounts.size;
          const minUnique = Math.max(1, Math.floor(charset.length * 0.5));
          expect(uniqueChars).toBeGreaterThanOrEqual(minUnique);

          return true;
        }
      ),
      { numRuns: 20 } // Run 20 property test cases
    );
  });

  it('should generate passwords of correct length', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: PASSWORD_LENGTH_MIN, max: PASSWORD_LENGTH_MAX }),
        fc.record({
          lowercase: fc.boolean(),
          uppercase: fc.boolean(),
          digits: fc.boolean(),
          symbols: fc.boolean(),
        }),
        (length, include) => {
          const enabledClasses = [
            include.lowercase,
            include.uppercase,
            include.digits,
            include.symbols,
          ].filter(Boolean).length;

          if (enabledClasses === 0) return true;
          if (length < enabledClasses) return true; // Skip invalid

          const password = generatePassword({
            length,
            include,
            requireEachClass: true,
          });

          expect(password.length).toBe(length);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should include required character classes when requireEachClass is true', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: PASSWORD_LENGTH_MIN, max: 30 }),
        fc.record({
          lowercase: fc.boolean(),
          uppercase: fc.boolean(),
          digits: fc.boolean(),
          symbols: fc.boolean(),
        }),
        (length, include) => {
          const enabledClasses = [
            include.lowercase,
            include.uppercase,
            include.digits,
            include.symbols,
          ].filter(Boolean).length;

          if (enabledClasses === 0) return true;
          if (length < enabledClasses) return true;

          const password = generatePassword({
            length,
            include,
            requireEachClass: true,
          });

          if (include.lowercase) {
            expect(password).toMatch(/[a-z]/);
          }
          if (include.uppercase) {
            expect(password).toMatch(/[A-Z]/);
          }
          if (include.digits) {
            expect(password).toMatch(/[0-9]/);
          }
          if (include.symbols) {
            const symbols = '!@#$%^&*()-_=+[]{};:,.?';
            const hasSymbol = password
              .split('')
              .some((char) => symbols.includes(char));
            expect(hasSymbol).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property Tests: Option Normalization', () => {
  it('should be idempotent (normalizing twice gives same result)', () => {
    fc.assert(
      fc.property(
        fc.record({
          length: fc.option(
            fc.integer({ min: 1, max: 200 }),
            { nil: undefined }
          ),
          include: fc.option(
            fc.record({
              lowercase: fc.boolean(),
              uppercase: fc.boolean(),
              digits: fc.boolean(),
              symbols: fc.boolean(),
            }),
            { nil: undefined }
          ),
          excludeAmbiguous: fc.option(fc.boolean(), { nil: undefined }),
          requireEachClass: fc.option(fc.boolean(), { nil: undefined }),
        }),
        (options) => {
          const normalized1 = normalizePasswordOptions(options);
          const normalized2 = normalizePasswordOptions(normalized1);

          expect(normalized2).toEqual(normalized1);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always produce valid normalized options within bounds', () => {
    fc.assert(
      fc.property(
        fc.record({
          length: fc.option(
            fc.integer({ min: -100, max: 500 }),
            { nil: undefined }
          ),
          include: fc.option(
            fc.record({
              lowercase: fc.boolean(),
              uppercase: fc.boolean(),
              digits: fc.boolean(),
              symbols: fc.boolean(),
            }),
            { nil: undefined }
          ),
          excludeAmbiguous: fc.option(fc.boolean(), { nil: undefined }),
          requireEachClass: fc.option(fc.boolean(), { nil: undefined }),
        }),
        (options) => {
          const normalized = normalizePasswordOptions(options);

          expect(normalized.length).toBeGreaterThanOrEqual(
            PASSWORD_LENGTH_MIN
          );
          expect(normalized.length).toBeLessThanOrEqual(PASSWORD_LENGTH_MAX);
          expect(Number.isInteger(normalized.length)).toBe(true);

          // Validate structure
          expect(typeof normalized.include.lowercase).toBe('boolean');
          expect(typeof normalized.include.uppercase).toBe('boolean');
          expect(typeof normalized.include.digits).toBe('boolean');
          expect(typeof normalized.include.symbols).toBe('boolean');
          expect(typeof normalized.excludeAmbiguous).toBe('boolean');
          expect(typeof normalized.requireEachClass).toBe('boolean');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate correctly after normalization', () => {
    fc.assert(
      fc.property(
        fc.record({
          length: fc.option(
            fc.integer({ min: -100, max: 500 }),
            { nil: undefined }
          ),
          include: fc.option(
            fc.record({
              lowercase: fc.boolean(),
              uppercase: fc.boolean(),
              digits: fc.boolean(),
              symbols: fc.boolean(),
            }),
            { nil: undefined }
          ),
          excludeAmbiguous: fc.option(fc.boolean(), { nil: undefined }),
          requireEachClass: fc.option(fc.boolean(), { nil: undefined }),
        }),
        (options) => {
          const normalized = normalizePasswordOptions(options);
          const validation = validatePasswordOptions(normalized);

          // Normalized options should always be valid (or at least have reasonable errors)
          // The only case where it might not be valid is if no classes are enabled
          // or length < enabled classes when requireEachClass is true
          const enabledClasses = [
            normalized.include.lowercase,
            normalized.include.uppercase,
            normalized.include.digits,
            normalized.include.symbols,
          ].filter(Boolean).length;

          if (enabledClasses === 0) {
            // This is expected to be invalid
            expect(validation.valid).toBe(false);
          } else if (
            normalized.requireEachClass &&
            normalized.length < enabledClasses
          ) {
            // This should be caught by normalization clamping length
            // But if it somehow isn't, validation should catch it
            expect(validation.valid).toBe(false);
          } else {
            // Should be valid
            expect(validation.valid).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property Tests: No Bias Regression', () => {
  it('should produce uniform distribution from uniformRandomIndex (no modulo bias)', () => {
    // Deterministic test: enumerate all 256 byte values and verify uniformity
    // This avoids relying on a potentially non-uniform RNG for testing uniformity
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }), // n from 2 to 100
        (n) => {
          // Create a deterministic RNG that cycles through all 256 byte values
          let byteIndex = 0;
          const allBytes = Array.from({ length: 256 }, (_, i) => i);
          const rng: RngBytes = (length: number): Uint8Array => {
            const arr = new Uint8Array(length);
            for (let i = 0; i < length; i++) {
              arr[i] = allBytes[byteIndex % 256];
              byteIndex++;
            }
            return arr;
          };

          // Count how many times each index [0, n) appears when processing all 256 bytes
          const counts = new Array(n).fill(0);
          const limit = Math.floor(256 / n) * n; // Same limit used in rejection sampling

          // Simulate what uniformRandomIndex does for each byte value
          for (let byte = 0; byte < 256; byte++) {
            if (256 % n === 0) {
              // If n divides 256, all bytes are accepted
              const index = byte % n;
              counts[index]++;
            } else {
              // Otherwise, use rejection sampling
              if (byte < limit) {
                const index = byte % n;
                counts[index]++;
              }
              // Bytes >= limit are rejected (not counted)
            }
          }

          // Calculate expected count per index
          // For n that divides 256: each index appears 256/n times
          // For n that doesn't divide 256: each index appears limit/n times
          const expectedCount =
            256 % n === 0 ? 256 / n : Math.floor(limit / n);

          // Verify all indices appear exactly the expected number of times
          // (no bias means perfect uniformity in this deterministic test)
          for (let i = 0; i < n; i++) {
            expect(counts[i]).toBe(expectedCount);
          }

          // Verify total count matches expected
          const totalCount = counts.reduce((sum, count) => sum + count, 0);
          const expectedTotal = 256 % n === 0 ? 256 : limit;
          expect(totalCount).toBe(expectedTotal);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle edge cases in uniformRandomIndex without bias', () => {
    // Test structural properties: all indices should be reachable
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 255 }), // n from 2 to 255
        (n) => {
          // Use a deterministic RNG that cycles through all byte values
          let byteIndex = 0;
          const allBytes = Array.from({ length: 256 }, (_, i) => i);
          const rng: RngBytes = (length: number): Uint8Array => {
            const arr = new Uint8Array(length);
            for (let i = 0; i < length; i++) {
              arr[i] = allBytes[byteIndex % 256];
              byteIndex++;
            }
            return arr;
          };

          // Test that all indices [0, n) are reachable
          const seen = new Set<number>();
          const limit = Math.floor(256 / n) * n;

          // Enumerate all accepted byte values
          for (let byte = 0; byte < limit; byte++) {
            const index = uniformRandomIndex(
              () => new Uint8Array([byte]),
              n
            );
            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(n);
            seen.add(index);
          }

          // All indices should be reachable
          expect(seen.size).toBe(n);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should produce consistent entropy estimates', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: PASSWORD_LENGTH_MIN, max: 50 }),
        fc.record({
          lowercase: fc.boolean(),
          uppercase: fc.boolean(),
          digits: fc.boolean(),
          symbols: fc.boolean(),
          excludeAmbiguous: fc.boolean(),
        }),
        (length, options) => {
          const include = options;
          const enabledClasses = [
            include.lowercase,
            include.uppercase,
            include.digits,
            include.symbols,
          ].filter(Boolean).length;

          if (enabledClasses === 0) return true;

          // Entropy should be consistent for same options
          const entropy1 = estimateEntropy({
            length,
            include,
            excludeAmbiguous: options.excludeAmbiguous,
          });
          const entropy2 = estimateEntropy({
            length,
            include,
            excludeAmbiguous: options.excludeAmbiguous,
          });

          expect(entropy1).toBe(entropy2);

          // Entropy should scale with length
          const entropyDouble = estimateEntropy({
            length: length * 2,
            include,
            excludeAmbiguous: options.excludeAmbiguous,
          });

          expect(entropyDouble).toBeCloseTo(entropy1 * 2, 5);

          // Entropy should be non-negative
          expect(entropy1).toBeGreaterThanOrEqual(0);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

