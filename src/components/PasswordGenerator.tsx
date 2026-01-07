import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generatePassword,
  estimateEntropy,
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

  const entropy = estimateEntropy(settings);

  return (
    <div className="password-generator">
      <div className="output-section">
        <label htmlFor="password-output" className="sr-only">
          Generated password
        </label>
        <input
          id="password-output"
          ref={outputRef}
          type="text"
          readOnly
          value={password}
          aria-label="Generated password"
          className="output-field"
        />
        <div className="output-actions">
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-copy"
            aria-label="Copy password to clipboard"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={generate}
            className="btn btn-regenerate"
            aria-label="Generate new password"
          >
            Regenerate
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

      <div className="entropy-display">
        <span className="entropy-label">Entropy:</span>
        <span className="entropy-value">{entropy.toFixed(1)} bits</span>
      </div>

      <div className="controls">
        <div className="control-group">
          <label htmlFor="length-slider" className="control-label">
            Length: <span className="length-value">{settings.length}</span>
          </label>
          <div className="length-controls">
            <input
              id="length-slider"
              type="range"
              min="8"
              max="128"
              value={settings.length}
              onChange={(e) =>
                updateSetting('length', parseInt(e.target.value, 10))
              }
              className="length-slider"
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
              className="length-input"
              aria-label="Password length (number input)"
            />
          </div>
        </div>

        <div className="control-group">
          <fieldset className="character-classes">
            <legend className="control-label">Character classes</legend>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.include.lowercase}
                  onChange={(e) =>
                    updateInclude('lowercase', e.target.checked)
                  }
                />
                <span>Lowercase (a-z)</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.include.uppercase}
                  onChange={(e) =>
                    updateInclude('uppercase', e.target.checked)
                  }
                />
                <span>Uppercase (A-Z)</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.include.digits}
                  onChange={(e) => updateInclude('digits', e.target.checked)}
                />
                <span>Digits (0-9)</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.include.symbols}
                  onChange={(e) => updateInclude('symbols', e.target.checked)}
                />
                <span>Symbols (!@#$...)</span>
              </label>
            </div>
          </fieldset>
        </div>

        <div className="control-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.excludeAmbiguous}
              onChange={(e) =>
                updateSetting('excludeAmbiguous', e.target.checked)
              }
            />
            <span>Exclude ambiguous characters (Il1O0)</span>
          </label>
        </div>

        <details
          className="advanced-section"
          open={showAdvanced}
          onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
        >
          <summary className="advanced-toggle">Advanced options</summary>
          <div className="advanced-content">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.requireEachClass}
                onChange={(e) =>
                  updateSetting('requireEachClass', e.target.checked)
                }
              />
              <span>Require at least one of each selected class</span>
            </label>
            <div className="advanced-note">
              <p>Passphrase mode and custom symbols coming soon.</p>
            </div>
          </div>
        </details>
      </div>

      <div className="keyboard-hints">
        <p className="hints-text">
          Keyboard shortcuts: <kbd>G</kbd>enerate, <kbd>C</kbd>opy, <kbd>L</kbd>
          ength, <kbd>S</kbd>ymbols
        </p>
      </div>
    </div>
  );
}

