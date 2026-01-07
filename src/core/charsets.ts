import {
  LOWER,
  UPPER,
  DIGIT,
  SYMBOL,
  AMBIGUOUS_CHARS,
} from './constants';
import type { CharacterClassOptions } from './types';

/**
 * Build character set from options
 * SPEC §6.1: Define canonical character sets
 * 
 * @param include Character class options
 * @param excludeAmbiguous Whether to exclude ambiguous characters
 * @returns Combined character set string
 */
export function buildCharset(
  include: CharacterClassOptions,
  excludeAmbiguous: boolean
): string {
  let charset = '';

  if (include.lowercase) {
    charset += LOWER;
  }
  if (include.uppercase) {
    charset += UPPER;
  }
  if (include.digits) {
    charset += DIGIT;
  }
  if (include.symbols) {
    charset += SYMBOL;
  }

  if (excludeAmbiguous) {
    // Remove ambiguous characters from the charset
    // Note: | is only in symbols, so we filter it conditionally
    const ambiguousSet = include.symbols
      ? AMBIGUOUS_CHARS
      : AMBIGUOUS_CHARS.replace('|', '');
    charset = charset
      .split('')
      .filter((char) => !ambiguousSet.includes(char))
      .join('');
  }

  return charset;
}

/**
 * Get individual character sets for each enabled class
 * Used when requireEachClass is true
 */
export function getClassCharsets(
  include: CharacterClassOptions,
  excludeAmbiguous: boolean
): string[] {
  const sets: string[] = [];

  if (include.lowercase) {
    let set = LOWER;
    if (excludeAmbiguous) {
      set = set.replace(/[Il1O0]/g, '');
    }
    if (set.length > 0) sets.push(set);
  }

  if (include.uppercase) {
    let set = UPPER;
    if (excludeAmbiguous) {
      set = set.replace(/[Il1O0]/g, '');
    }
    if (set.length > 0) sets.push(set);
  }

  if (include.digits) {
    let set = DIGIT;
    if (excludeAmbiguous) {
      set = set.replace(/[Il1O0]/g, '');
    }
    if (set.length > 0) sets.push(set);
  }

  if (include.symbols) {
    let set = SYMBOL;
    if (excludeAmbiguous) {
      set = set.replace(/[Il1O0|]/g, '');
    }
    if (set.length > 0) sets.push(set);
  }

  return sets;
}

