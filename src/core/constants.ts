/**
 * Character sets as defined in SPEC §6.1
 */

export const LOWER = 'abcdefghijklmnopqrstuvwxyz';
export const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const DIGIT = '0123456789';
export const SYMBOL = '!@#$%^&*()-_=+[]{};:,.?';

/**
 * Ambiguous characters to exclude when excludeAmbiguous is true
 * SPEC §5.1: Il1O0 (and optionally | if symbols enabled)
 */
export const AMBIGUOUS_CHARS = 'Il1O0|';

/**
 * Bounds as defined in SPEC §6.5
 */
export const PASSWORD_LENGTH_MIN = 8;
export const PASSWORD_LENGTH_MAX = 128;
export const PASSPHRASE_WORD_COUNT_MIN = 3;
export const PASSPHRASE_WORD_COUNT_MAX = 10;

/**
 * Default options as defined in SPEC §5
 */
export const DEFAULT_PASSWORD_LENGTH = 20;
export const DEFAULT_PASSPHRASE_WORD_COUNT = 5;
export const DEFAULT_PASSPHRASE_SEPARATOR = '-';

