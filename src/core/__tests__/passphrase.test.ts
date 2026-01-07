import { describe, it, expect } from 'vitest';
import { generatePassphrase } from '../passphrase';

describe('generatePassphrase', () => {
  it('should throw error indicating passphrase mode is not implemented', () => {
    expect(() => {
      generatePassphrase({});
    }).toThrow('Passphrase mode is not yet implemented');
  });

  it('should include reference to SPEC in error message', () => {
    try {
      generatePassphrase({});
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const message = (error as Error).message;
      expect(message).toContain('SPEC.md');
    }
  });
});

