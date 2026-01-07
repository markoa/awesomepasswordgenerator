import type { PassphraseOptions, NormalizedPassphraseOptions, RngBytes } from './types';
import { defaultRng, uniformRandomIndex } from './random';
import { normalizePassphraseOptions, validatePassphraseOptions } from './validation';
import { WORDLIST } from './wordlist';
import { DIGIT, SYMBOL } from './constants';

/**
 * Generate a passphrase according to the options
 * SPEC §3.2: Passphrase mode
 * SPEC §6.6: Passphrase mode rules
 * 
 * @param options Passphrase generation options
 * @param rng Optional RNG function (defaults to crypto.getRandomValues)
 * @returns Generated passphrase string
 * @throws Error if options are invalid and cannot be normalized
 */
export function generatePassphrase(
  options: Partial<PassphraseOptions>,
  rng: RngBytes = defaultRng
): string {
  // Validate before normalizing to catch invalid configs
  const validation = validatePassphraseOptions(options);
  if (!validation.valid) {
    throw new Error(
      `Invalid passphrase options: ${validation.errors.join(', ')}`
    );
  }

  const normalized = normalizePassphraseOptions(options);

  // SPEC §6.6: Word selection must be uniform using secure RNG
  const words: string[] = [];
  for (let i = 0; i < normalized.wordCount; i++) {
    const index = uniformRandomIndex(rng, WORDLIST.length);
    words.push(WORDLIST[index]);
  }

  // Apply capitalization transforms
  // SPEC §6.6: Optional transforms
  if (normalized.capitalization === 'first') {
    // Capitalize first letter of each word
    for (let i = 0; i < words.length; i++) {
      words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
  } else if (normalized.capitalization === 'random') {
    // Randomly capitalize one word
    const randomIndex = uniformRandomIndex(rng, words.length);
    words[randomIndex] = words[randomIndex].charAt(0).toUpperCase() + words[randomIndex].slice(1);
  }
  // 'none' case: all words remain lowercase (default)

  // Join words with separator
  let passphrase = words.join(normalized.separator);

  // Add optional digit block (2 digits as per SPEC §6.6)
  if (normalized.addDigit) {
    const digit1 = uniformRandomIndex(rng, DIGIT.length);
    const digit2 = uniformRandomIndex(rng, DIGIT.length);
    passphrase += DIGIT[digit1] + DIGIT[digit2];
  }

  // Add optional symbol
  if (normalized.addSymbol) {
    const symbolIndex = uniformRandomIndex(rng, SYMBOL.length);
    passphrase += SYMBOL[symbolIndex];
  }

  return passphrase;
}

