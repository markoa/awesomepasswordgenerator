import type {
  PasswordOptions,
  NormalizedPasswordOptions,
  ValidationResult,
} from './types';
import {
  PASSWORD_LENGTH_MIN,
  PASSWORD_LENGTH_MAX,
  PASSPHRASE_WORD_COUNT_MIN,
  PASSPHRASE_WORD_COUNT_MAX,
  DEFAULT_PASSWORD_LENGTH,
} from './constants';

/**
 * Validate password options
 * SPEC §6.4: The generator must reject/normalize invalid configurations
 */
export function validatePasswordOptions(
  options: Partial<PasswordOptions>
): ValidationResult {
  const errors: string[] = [];

  const length = options.length ?? DEFAULT_PASSWORD_LENGTH;
  if (!Number.isInteger(length)) {
    errors.push('Length must be an integer');
  } else if (length < PASSWORD_LENGTH_MIN || length > PASSWORD_LENGTH_MAX) {
    errors.push(
      `Length must be between ${PASSWORD_LENGTH_MIN} and ${PASSWORD_LENGTH_MAX}`
    );
  }

  const include = options.include ?? {
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: false,
  };

  const enabledClasses = [
    include.lowercase,
    include.uppercase,
    include.digits,
    include.symbols,
  ].filter(Boolean).length;

  if (enabledClasses === 0) {
    errors.push('At least one character class must be enabled');
  }

  if (options.requireEachClass && length < enabledClasses) {
    errors.push(
      `Length must be at least ${enabledClasses} when requiring each class`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize password options with defaults
 * SPEC §5.1: Default password settings
 */
export function normalizePasswordOptions(
  options: Partial<PasswordOptions>
): NormalizedPasswordOptions {
  const length = Math.max(
    PASSWORD_LENGTH_MIN,
    Math.min(
      PASSWORD_LENGTH_MAX,
      Math.round(options.length ?? DEFAULT_PASSWORD_LENGTH)
    )
  );

  const include = options.include ?? {
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: false,
  };

  return {
    length,
    include,
    excludeAmbiguous: options.excludeAmbiguous ?? true,
    requireEachClass: options.requireEachClass ?? true,
  };
}

/**
 * Validate passphrase options
 */
export function validatePassphraseOptions(
  options: Partial<{ wordCount: number }>
): ValidationResult {
  const errors: string[] = [];

  const wordCount = options.wordCount ?? 5;
  if (!Number.isInteger(wordCount)) {
    errors.push('Word count must be an integer');
  } else if (
    wordCount < PASSPHRASE_WORD_COUNT_MIN ||
    wordCount > PASSPHRASE_WORD_COUNT_MAX
  ) {
    errors.push(
      `Word count must be between ${PASSPHRASE_WORD_COUNT_MIN} and ${PASSPHRASE_WORD_COUNT_MAX}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

