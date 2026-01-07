/**
 * Character class options for password generation
 */
export interface CharacterClassOptions {
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
}

/**
 * Password generation options
 */
export interface PasswordOptions {
  length: number;
  include: CharacterClassOptions;
  excludeAmbiguous: boolean;
  requireEachClass: boolean;
}

/**
 * Passphrase generation options
 */
export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalization: 'none' | 'first' | 'random';
  addDigit: boolean;
  addSymbol: boolean;
}

/**
 * Normalized options after validation and defaults
 */
export interface NormalizedPasswordOptions extends PasswordOptions {
  length: number; // Guaranteed to be within bounds
}

export interface NormalizedPassphraseOptions extends PassphraseOptions {
  wordCount: number; // Guaranteed to be within bounds
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Random number generator function type
 * For testing, this can be injected; in production, uses crypto.getRandomValues
 */
export type RngBytes = (length: number) => Uint8Array;

