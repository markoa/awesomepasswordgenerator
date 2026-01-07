import { describe, it, expect } from 'vitest';
import { normalizePasswordOptions } from '../validation';

/**
 * Snapshot test for normalized options
 * SPEC §12: Snapshot tests for normalized options
 */
describe('normalizePasswordOptions snapshot', () => {
  it('should normalize empty options to defaults', () => {
    const normalized = normalizePasswordOptions({});
    expect(normalized).toMatchSnapshot();
  });

  it('should normalize partial options', () => {
    const normalized = normalizePasswordOptions({
      length: 25,
      include: {
        lowercase: true,
        uppercase: false,
        digits: true,
        symbols: true,
      },
    });
    expect(normalized).toMatchSnapshot();
  });

  it('should normalize with all options provided', () => {
    const normalized = normalizePasswordOptions({
      length: 30,
      include: {
        lowercase: true,
        uppercase: true,
        digits: true,
        symbols: true,
      },
      excludeAmbiguous: false,
      requireEachClass: false,
    });
    expect(normalized).toMatchSnapshot();
  });
});

