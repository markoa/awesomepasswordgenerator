/**
 * Core password generator module
 * Framework-agnostic, dependency-free implementation
 * SPEC §11.2: Core module API
 */

export { generatePassword, estimateEntropy } from './password';
export { generatePassphrase } from './passphrase';
export {
  validatePasswordOptions,
  normalizePasswordOptions,
  validatePassphraseOptions,
  normalizePassphraseOptions,
} from './validation';
export type {
  PasswordOptions,
  PassphraseOptions,
  NormalizedPasswordOptions,
  NormalizedPassphraseOptions,
  CharacterClassOptions,
  ValidationResult,
  RngBytes,
} from './types';
export {
  LOWER,
  UPPER,
  DIGIT,
  SYMBOL,
  AMBIGUOUS_CHARS,
  PASSWORD_LENGTH_MIN,
  PASSWORD_LENGTH_MAX,
  PASSPHRASE_WORD_COUNT_MIN,
  PASSPHRASE_WORD_COUNT_MAX,
  DEFAULT_PASSWORD_LENGTH,
  DEFAULT_PASSPHRASE_WORD_COUNT,
  DEFAULT_PASSPHRASE_SEPARATOR,
} from './constants';

