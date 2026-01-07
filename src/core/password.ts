import type {
  PasswordOptions,
  NormalizedPasswordOptions,
  RngBytes,
} from './types';
import { defaultRng, uniformRandomIndex, shuffle } from './random';
import { buildCharset, getClassCharsets } from './charsets';
import {
  normalizePasswordOptions,
  validatePasswordOptions,
} from './validation';

/**
 * Generate a password according to the options
 * SPEC §3.1: Password mode (required)
 * SPEC §6.4: The generator must reject/normalize invalid configurations
 * 
 * @param options Password generation options
 * @param rng Optional RNG function (defaults to crypto.getRandomValues)
 * @returns Generated password string
 * @throws Error if options are invalid and cannot be normalized
 */
export function generatePassword(
  options: Partial<PasswordOptions>,
  rng: RngBytes = defaultRng
): string {
  // Validate before normalizing to catch invalid configs
  // Normalization clamps values, but we should reject truly invalid configs
  const validation = validatePasswordOptions(options);
  if (!validation.valid) {
    throw new Error(
      `Invalid password options: ${validation.errors.join(', ')}`
    );
  }

  const normalized = normalizePasswordOptions(options);

  // Build character sets
  const unionCharset = buildCharset(
    normalized.include,
    normalized.excludeAmbiguous
  );

  if (unionCharset.length === 0) {
    throw new Error('No characters available for password generation');
  }

  const password: string[] = [];

  if (normalized.requireEachClass) {
    // SPEC §6.3: Ensure at least one character from each enabled class
    const classCharsets = getClassCharsets(
      normalized.include,
      normalized.excludeAmbiguous
    );

    if (classCharsets.length === 0) {
      throw new Error('No character classes available');
    }

    // Select one character from each class
    for (const charset of classCharsets) {
      if (charset.length === 0) continue;
      const index = uniformRandomIndex(rng, charset.length);
      password.push(charset[index]);
    }

    // Fill remaining positions from union set
    const remaining = normalized.length - password.length;
    for (let i = 0; i < remaining; i++) {
      const index = uniformRandomIndex(rng, unionCharset.length);
      password.push(unionCharset[index]);
    }
  } else {
    // All characters drawn from union set only
    for (let i = 0; i < normalized.length; i++) {
      const index = uniformRandomIndex(rng, unionCharset.length);
      password.push(unionCharset[index]);
    }
  }

  // SPEC §6.3: Shuffle final characters uniformly
  shuffle(password, rng);

  return password.join('');
}

/**
 * Estimate entropy in bits
 * SPEC §9.2: Display estimated entropy
 * 
 * @param options Password generation options
 * @returns Entropy in bits
 */
export function estimateEntropy(
  options: Partial<PasswordOptions>
): number {
  const normalized = normalizePasswordOptions(options);
  const charset = buildCharset(
    normalized.include,
    normalized.excludeAmbiguous
  );

  if (charset.length === 0) {
    return 0;
  }

  // entropy_bits = length * log2(charset_size)
  return normalized.length * Math.log2(charset.length);
}

