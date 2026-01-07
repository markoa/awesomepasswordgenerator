import type { RngBytes } from './types';

/**
 * Default RNG using crypto.getRandomValues
 * SPEC §2.3: Use crypto.getRandomValues as the only randomness source
 */
export const defaultRng: RngBytes = (length: number): Uint8Array => {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('crypto.getRandomValues is not available');
  }
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
};

/**
 * Rejection sampling to avoid modulo bias
 * SPEC §6.2: Use rejection sampling when N does not divide 256
 * 
 * @param rng Random number generator function
 * @param n Size of the set to select from
 * @returns A uniformly random index in [0, n)
 */
export function uniformRandomIndex(rng: RngBytes, n: number): number {
  if (n <= 0) {
    throw new Error('n must be positive');
  }
  if (n === 1) {
    return 0;
  }

  // For n <= 256, use single-byte rejection sampling
  if (n <= 256) {
    // If n divides 256, we can use modulo directly
    if (256 % n === 0) {
      const bytes = rng(1);
      return bytes[0] % n;
    }

    // Otherwise, use rejection sampling
    const limit = Math.floor(256 / n) * n;
    let byte: number;
    do {
      const bytes = rng(1);
      byte = bytes[0];
    } while (byte >= limit);

    return byte % n;
  }

  // For n > 256, we need multiple bytes to cover the range
  // Calculate how many bytes we need: ceil(log256(n))
  // Then use rejection sampling on the combined value
  const bitsNeeded = Math.ceil(Math.log2(n));
  const bytesNeeded = Math.ceil(bitsNeeded / 8);
  const maxValue = Math.pow(256, bytesNeeded);
  const limit = Math.floor(maxValue / n) * n;

  let value: number;
  do {
    const bytes = rng(bytesNeeded);
    // Combine bytes into a single number (big-endian)
    value = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      value = value * 256 + bytes[i];
    }
  } while (value >= limit);

  return value % n;
}

/**
 * Fisher-Yates shuffle using secure RNG
 * SPEC §6.3: Shuffle final characters uniformly
 * 
 * @param array Array to shuffle in place
 * @param rng Random number generator function
 */
export function shuffle<T>(array: T[], rng: RngBytes): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = uniformRandomIndex(rng, i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
}

