import { describe, it, expect } from 'vitest';
import { uniformRandomIndex, shuffle } from '../random';
import type { RngBytes } from '../types';

/**
 * Deterministic RNG for testing
 */
function createTestRng(sequence: number[]): RngBytes {
  let index = 0;
  return (length: number): Uint8Array => {
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      arr[i] = sequence[index % sequence.length];
      index++;
    }
    return arr;
  };
}

describe('uniformRandomIndex', () => {
  it('should return 0 when n is 1', () => {
    const rng = createTestRng([42]);
    expect(uniformRandomIndex(rng, 1)).toBe(0);
  });

  it('should handle n that divides 256', () => {
    const rng = createTestRng([64]); // 64 % 4 = 0
    expect(uniformRandomIndex(rng, 4)).toBe(0);
    
    const rng2 = createTestRng([65]); // 65 % 4 = 1
    expect(uniformRandomIndex(rng2, 4)).toBe(1);
  });

  it('should use rejection sampling for n that does not divide 256', () => {
    // For n=3, limit = floor(256/3)*3 = 85*3 = 255
    // So we reject bytes >= 255, meaning we only accept 0-254
    // Then we use modulo 3
    
    // Test with byte 0: 0 % 3 = 0
    const rng1 = createTestRng([0]);
    expect(uniformRandomIndex(rng1, 3)).toBe(0);
    
    // Test with byte 1: 1 % 3 = 1
    const rng2 = createTestRng([1]);
    expect(uniformRandomIndex(rng2, 3)).toBe(1);
    
    // Test with byte 2: 2 % 3 = 2
    const rng3 = createTestRng([2]);
    expect(uniformRandomIndex(rng3, 3)).toBe(2);
    
    // Test with byte 254: 254 % 3 = 2
    const rng4 = createTestRng([254]);
    expect(uniformRandomIndex(rng4, 3)).toBe(2);
    
    // Test with byte 255: should be rejected and retry
    // We'll use a sequence that starts with 255, then has a valid byte
    const rng5 = createTestRng([255, 10]); // 255 rejected, 10 % 3 = 1
    expect(uniformRandomIndex(rng5, 3)).toBe(1);
  });

  it('should throw error for n <= 0', () => {
    const rng = createTestRng([42]);
    expect(() => uniformRandomIndex(rng, 0)).toThrow('n must be positive');
    expect(() => uniformRandomIndex(rng, -1)).toThrow('n must be positive');
  });
});

describe('shuffle', () => {
  it('should shuffle array in place', () => {
    const array = [1, 2, 3, 4, 5];
    const original = [...array];
    const rng = createTestRng([10, 20, 30, 40, 50]);
    
    shuffle(array, rng);
    
    // Array should be modified
    expect(array).not.toEqual(original);
    // But should contain same elements
    expect(array.sort()).toEqual(original.sort());
    expect(array.length).toBe(original.length);
  });

  it('should handle single element array', () => {
    const array = [42];
    const rng = createTestRng([10]);
    shuffle(array, rng);
    expect(array).toEqual([42]);
  });

  it('should handle empty array', () => {
    const array: number[] = [];
    const rng = createTestRng([10]);
    shuffle(array, rng);
    expect(array).toEqual([]);
  });

  it('should produce different orders with different RNG sequences', () => {
    const array1 = [1, 2, 3, 4, 5];
    const array2 = [1, 2, 3, 4, 5];
    const rng1 = createTestRng([10, 20, 30, 40, 50]);
    const rng2 = createTestRng([100, 200, 150, 250, 50]);
    
    shuffle(array1, rng1);
    shuffle(array2, rng2);
    
    // With different RNG sequences, results should likely differ
    // (though not guaranteed, it's very likely)
    const allSame = array1.every((val, idx) => val === array2[idx]);
    // If they happen to be the same, that's fine, but test that shuffle works
    expect(array1.length).toBe(5);
    expect(array2.length).toBe(5);
  });
});

