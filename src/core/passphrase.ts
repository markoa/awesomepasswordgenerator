import type { PassphraseOptions, RngBytes } from './types';
import { defaultRng } from './random';

/**
 * Generate a passphrase (stub - not yet implemented)
 * SPEC §3.2: Passphrase mode
 * 
 * @param options Passphrase generation options
 * @param rng Optional RNG function (defaults to crypto.getRandomValues)
 * @returns Generated passphrase string
 * @throws Error indicating passphrase mode is not yet implemented
 */
export function generatePassphrase(
  options: Partial<PassphraseOptions>,
  rng: RngBytes = defaultRng
): string {
  throw new Error(
    'Passphrase mode is not yet implemented. See SPEC.md §3.2 for planned functionality.'
  );
}

