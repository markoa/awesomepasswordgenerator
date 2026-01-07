import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadSettings } from '../PasswordGenerator';
import {
  DEFAULT_PASSWORD_LENGTH,
  DEFAULT_PASSPHRASE_WORD_COUNT,
  DEFAULT_PASSPHRASE_SEPARATOR,
} from '../../core';

type LocalStorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const originalWindow = 'window' in globalThis ? globalThis.window : undefined;
const originalLocalStorage =
  'localStorage' in globalThis ? globalThis.localStorage : undefined;

function mockLocalStorage(value: string | null): LocalStorageMock {
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
}

function installStorage(value: string | null) {
  (globalThis as typeof globalThis & { window: Window }).window = {} as Window;
  (globalThis as typeof globalThis & { localStorage: LocalStorageMock }).localStorage =
    mockLocalStorage(value);
}

describe('loadSettings', () => {
  beforeEach(() => {
    installStorage(null);
  });

  afterEach(() => {
    if (typeof originalWindow === 'undefined') {
      delete (globalThis as { window?: Window }).window;
    } else {
      (globalThis as typeof globalThis & { window: Window }).window = originalWindow;
    }
    if (typeof originalLocalStorage === 'undefined') {
      delete (globalThis as { localStorage?: Storage }).localStorage;
    } else {
      (globalThis as typeof globalThis & { localStorage: Storage }).localStorage =
        originalLocalStorage;
    }
  });

  it('returns defaults when window is undefined', () => {
    delete (globalThis as { window?: Window }).window;
    const settings = loadSettings();
    expect(settings.length).toBe(DEFAULT_PASSWORD_LENGTH);
    expect(settings.mode).toBe('password');
    expect(settings.include.lowercase).toBe(true);
  });

  it('returns defaults when storage is empty', () => {
    const settings = loadSettings();
    expect(settings.length).toBe(DEFAULT_PASSWORD_LENGTH);
    expect(settings.wordCount).toBe(DEFAULT_PASSPHRASE_WORD_COUNT);
    expect(settings.separator).toBe(DEFAULT_PASSPHRASE_SEPARATOR);
  });

  it('falls back to defaults for invalid JSON', () => {
    installStorage('{not-json');
    const settings = loadSettings();
    expect(settings.length).toBe(DEFAULT_PASSWORD_LENGTH);
    expect(settings.excludeAmbiguous).toBe(true);
  });

  it('clamps numeric values and validates types', () => {
    installStorage(
      JSON.stringify({
        length: 1000,
        wordCount: -5,
      })
    );
    const settings = loadSettings();
    expect(settings.length).toBe(128);
    expect(settings.wordCount).toBe(3);
  });

  it('rejects stringified booleans and preserves defaults', () => {
    installStorage(
      JSON.stringify({
        include: {
          lowercase: 'false',
        },
        excludeAmbiguous: 'false',
        requireEachClass: 'true',
        addDigit: 'false',
      })
    );
    const settings = loadSettings();
    expect(settings.include.lowercase).toBe(true);
    expect(settings.excludeAmbiguous).toBe(true);
    expect(settings.requireEachClass).toBe(true);
    expect(settings.addDigit).toBe(false);
  });

  it('accepts valid stored values', () => {
    installStorage(
      JSON.stringify({
        mode: 'passphrase',
        length: 16,
        include: {
          lowercase: false,
          uppercase: true,
          digits: false,
          symbols: true,
        },
        excludeAmbiguous: false,
        requireEachClass: false,
        wordCount: 6,
        separator: '_',
        capitalization: 'first',
        addDigit: true,
        addSymbol: true,
      })
    );
    const settings = loadSettings();
    expect(settings.mode).toBe('passphrase');
    expect(settings.length).toBe(16);
    expect(settings.include.lowercase).toBe(false);
    expect(settings.include.symbols).toBe(true);
    expect(settings.excludeAmbiguous).toBe(false);
    expect(settings.requireEachClass).toBe(false);
    expect(settings.wordCount).toBe(6);
    expect(settings.separator).toBe('_');
    expect(settings.capitalization).toBe('first');
    expect(settings.addDigit).toBe(true);
    expect(settings.addSymbol).toBe(true);
  });

  it('falls back to default separator when stored value is invalid', () => {
    installStorage(
      JSON.stringify({
        separator: 123,
      })
    );
    const settings = loadSettings();
    expect(settings.separator).toBe(DEFAULT_PASSPHRASE_SEPARATOR);
  });

  it('falls back to default capitalization when stored value is invalid', () => {
    installStorage(
      JSON.stringify({
        capitalization: 'uppercase',
      })
    );
    const settings = loadSettings();
    expect(settings.capitalization).toBe('none');
  });
});
