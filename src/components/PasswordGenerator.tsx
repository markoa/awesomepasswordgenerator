import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generatePassword,
  type PasswordOptions,
  DEFAULT_PASSWORD_LENGTH,
} from '../core';

interface StoredSettings {
  length: number;
  include: {
    lowercase: boolean;
    uppercase: boolean;
    digits: boolean;
    symbols: boolean;
  };
  excludeAmbiguous: boolean;
  requireEachClass: boolean;
}

const STORAGE_KEY = 'password-generator-settings';

const defaultSettings: StoredSettings = {
  length: DEFAULT_PASSWORD_LENGTH,
  include: {
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: false,
  },
  excludeAmbiguous: true,
  requireEachClass: true,
};

function loadSettings(): StoredSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate and merge with defaults
      return {
        length: Number.isInteger(parsed.length)
          ? Math.max(8, Math.min(128, parsed.length))
          : defaultSettings.length,
        include: {
          lowercase: parsed.include?.lowercase ?? defaultSettings.include.lowercase,
          uppercase: parsed.include?.uppercase ?? defaultSettings.include.uppercase,
          digits: parsed.include?.digits ?? defaultSettings.include.digits,
          symbols: parsed.include?.symbols ?? defaultSettings.include.symbols,
        },
        excludeAmbiguous:
          parsed.excludeAmbiguous ?? defaultSettings.excludeAmbiguous,
        requireEachClass:
          parsed.requireEachClass ?? defaultSettings.requireEachClass,
      };
    }
  } catch (e) {
    // Ignore parse errors
  }
  return defaultSettings;
}

function saveSettings(settings: StoredSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // Ignore storage errors
  }
}

export default function PasswordGenerator() {
  const [settings, setSettings] = useState<StoredSettings>(loadSettings);
  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const lengthInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLInputElement>(null);
  const copyAnnouncementRef = useRef<HTMLDivElement>(null);


  const generate = useCallback(() => {
    try {
      const options: PasswordOptions = {
        length: settings.length,
        include: settings.include,
        excludeAmbiguous: settings.excludeAmbiguous,
        requireEachClass: settings.requireEachClass,
      };
      const newPassword = generatePassword(options);
      setPassword(newPassword);
      setCopied(false);
    } catch (error) {
      // Should not happen with valid settings, but handle gracefully
      console.error('Password generation error:', error);
    }
  }, [
    settings.length,
    settings.include,
    settings.excludeAmbiguous,
    settings.requireEachClass,
  ]);

  // Save settings to localStorage when they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Regenerate when settings change
  useEffect(() => {
    generate();
  }, [generate]);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = password;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        // Ignore
      }
      document.body.removeChild(textArea);
    }
  };

  const updateSetting = <K extends keyof StoredSettings>(
    key: K,
    value: StoredSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateInclude = (
    key: keyof StoredSettings['include'],
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      include: { ...prev.include, [key]: value },
    }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'g':
          e.preventDefault();
          generate();
          break;
        case 'c':
          e.preventDefault();
          handleCopy();
          break;
        case 'l':
          e.preventDefault();
          lengthInputRef.current?.focus();
          break;
        case 's':
          e.preventDefault();
          updateInclude('symbols', !settings.include.symbols);
          break;
        case 'm':
          e.preventDefault();
          // Toggle passphrase mode (stub for now)
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generate, handleCopy, settings.include.symbols]);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
      {/* Password Output Section */}
      <div className="space-y-4">
        <label htmlFor="password-output" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Your new password
        </label>
        <div className="relative">
          <input
            id="password-output"
            ref={outputRef}
            type="text"
            readOnly
            value={password}
            aria-label="Generated password"
            className="w-full px-4 py-3 sm:py-4 text-lg sm:text-xl font-mono text-center bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent select-all text-gray-900 dark:text-gray-100 transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              copied
                ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
                : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
            }`}
            aria-label="Copy password to clipboard"
          >
            {copied ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Password
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={generate}
            className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Generate new password"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              New Password
            </span>
          </button>
        </div>
        <div
          ref={copyAnnouncementRef}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {copied ? 'Password copied to clipboard' : ''}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
        {/* Password Length */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="length-slider" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Password Length
            </label>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {settings.length}
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <input
              id="length-slider"
              type="range"
              min="8"
              max="128"
              value={settings.length}
              onChange={(e) =>
                updateSetting('length', parseInt(e.target.value, 10))
              }
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
              aria-label="Password length"
            />
            <input
              ref={lengthInputRef}
              type="number"
              min="8"
              max="128"
              value={settings.length}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 8 && value <= 128) {
                  updateSetting('length', value);
                }
              }}
              className="w-20 px-3 py-1.5 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Password length (number input)"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Longer passwords are more secure. We recommend at least 16 characters.
          </p>
        </div>

        {/* Character Types */}
        <div className="space-y-3">
          <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <legend className="px-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Include These Types of Characters
            </legend>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
              Select which types of characters you want in your password
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.include.lowercase}
                  onChange={(e) =>
                    updateInclude('lowercase', e.target.checked)
                  }
                  className="w-5 h-5 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                    Lowercase letters
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    a, b, c, d...
                  </span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.include.uppercase}
                  onChange={(e) =>
                    updateInclude('uppercase', e.target.checked)
                  }
                  className="w-5 h-5 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                    Uppercase letters
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    A, B, C, D...
                  </span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.include.digits}
                  onChange={(e) => updateInclude('digits', e.target.checked)}
                  className="w-5 h-5 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                    Numbers
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    0, 1, 2, 3...
                  </span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.include.symbols}
                  onChange={(e) => updateInclude('symbols', e.target.checked)}
                  className="w-5 h-5 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                    Special characters
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    !, @, #, $...
                  </span>
                </div>
              </label>
            </div>
          </fieldset>
        </div>

        {/* Exclude Ambiguous */}
        <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={settings.excludeAmbiguous}
            onChange={(e) =>
              updateSetting('excludeAmbiguous', e.target.checked)
            }
            className="mt-0.5 w-5 h-5 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
              Exclude confusing characters
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Removes characters that look similar (like I, l, 1, O, 0) to avoid confusion when typing
            </span>
          </div>
        </label>

        {/* Advanced Options */}
        <details
          className="group"
          open={showAdvanced}
          onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer list-none p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Advanced Options
              </span>
              <svg 
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="mt-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireEachClass}
                onChange={(e) =>
                  updateSetting('requireEachClass', e.target.checked)
                }
                className="mt-0.5 w-5 h-5 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                  Guarantee each type is included
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ensures your password has at least one character from each selected type above
                </span>
              </div>
            </label>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                More options like passphrase mode and custom symbols are coming soon.
              </p>
            </div>
          </div>
        </details>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          <span className="font-medium">Keyboard shortcuts:</span>{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">G</kbd>enerate,{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">C</kbd>opy,{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">L</kbd>ength,{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">S</kbd>ymbols
        </p>
      </div>
    </div>
  );
}

