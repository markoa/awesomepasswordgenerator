# awesomepasswordgenerator.com — SPEC

## 0. Purpose

Build an open source, minimal, ad-free password generator website that is:
- Fast (instant generation)
- Trustworthy (transparent implementation, no third-party scripts)
- Private (no network calls required to generate)
- Accessible (keyboard-first, screen-reader friendly)
- Small (minimal shipped JS/CSS)

Primary use-case: generate strong passwords locally in the browser.

## 1. Non-goals

- No accounts, logins, sync, cloud storage, or “vault”
- No password strength “theater” beyond clear entropy/math display
- No analytics by default (no tracking pixels, no third-party telemetry)
- No monetization UI (ads, affiliate links, popups)
- No external dependencies for core generation logic

## 2. Security and Privacy Posture

### 2.1 Local-only generation
- Password generation must happen entirely client-side.
- The app must function with the network offline after initial load (optional PWA; see §10).

### 2.2 No data collection
- The app must not transmit generated passwords.
- The app must not log generated passwords to console or telemetry.
- Settings may be persisted locally (see §7); generated passwords must never be stored.

### 2.3 Randomness source
- Use `crypto.getRandomValues` as the only randomness source.
- Must avoid modulo bias when mapping random bytes to character indices (see §6.2).

### 2.4 Hardening (deployment headers)
- Use strict CSP; no third-party scripts.
- Include HSTS, X-Content-Type-Options, Referrer-Policy, and a conservative Permissions-Policy.
- Avoid inline scripts if feasible; if used, document why.

## 3. Supported Modes (MVP)

### 3.1 Password mode (required)
Generate a single password string from selected character classes and options.

### 3.2 Passphrase mode
Generate a multi-word passphrase with optional separator and capitalization rules.

## 4. UX Requirements

### 4.1 Rules
- The main page must be usable entirely via keyboard.
- Provide explicit hotkeys:
  - `g`: generate/regenerate
  - `c`: copy
  - `l`: focus length input
  - `s`: toggle symbols
  - `m`: toggle passphrase mode (if enabled)
- Hotkeys must not interfere with typing in inputs (disable when a text/number input is focused).

### 4.2 Copy behavior
- Copy button copies current output to clipboard using Clipboard API with fallback.
- Provide a non-intrusive confirmation:
  - Visual (e.g., “Copied” text) AND
  - Screen-reader announcement via `aria-live`.
- Never auto-copy on page load.
- Do not request clipboard permission unless user clicks Copy.

### 4.3 Output field
- Output must be clearly selectable.
- Output must not be editable by default (read-only).
- Provide “Reveal/Hide” toggle only if output masking is implemented; otherwise omit.

### 4.4 Initial state
- On first load, auto-generate a password using defaults (see §5) OR show an empty state with a prominent Generate button.
- Choose one and keep it consistent; document decision in README.

### 4.5 Advanced options disclosure
- Advanced options should be collapsible to keep UI minimal.

## 5. Defaults (MVP)

Defaults must be opinionated, modern, and simple.

### 5.1 Default password settings
- Length: 20
- Include: lowercase, uppercase, digits
- Symbols: off by default (toggle on)
- Exclude ambiguous characters: ON by default
  - Ambiguous set: `Il1O0` (optionally include `|` if symbols enabled; see §6.3)
- Require at least one from each enabled class: ON by default

### 5.2 Default passphrase settings (if enabled)
- Word count: 5
- Separator: `-`
- Capitalization: none (all lower) by default
- Add digit/symbol: off by default

## 6. Generation Rules

## 6.1 Character sets
Define canonical character sets:

- LOWER: `abcdefghijklmnopqrstuvwxyz`
- UPPER: `ABCDEFGHIJKLMNOPQRSTUVWXYZ`
- DIGIT: `0123456789`
- SYMBOL: a conservative ASCII set (exact set must be defined and fixed):
  - Proposed: `!@#$%^&*()-_=+[]{};:,.?`
  - Exclude quotes/backticks by default to reduce escaping issues.

If “Exclude ambiguous” is enabled, remove characters from all sets that match the ambiguous list.

### 6.2 Uniform randomness (no modulo bias)
When selecting indices from a set length `N`, do not use `byte % N` unless `N` divides 256.
Use rejection sampling:
- Compute `limit = floor(256 / N) * N`
- Draw random bytes; discard any `b >= limit`
- Map accepted byte to `b % N`

This must be implemented in the core module and covered by tests.

### 6.3 “Require each selected class”
If enabled:
- Ensure at least one character from each enabled class is present.
- Remaining characters are drawn from the union set.
- Shuffle final characters uniformly (Fisher–Yates using secure RNG).

If disabled:
- All characters drawn from union set only.

### 6.4 Constraints validation
The generator must reject/normalize invalid configurations:
- Length must be integer within bounds (see §6.5).
- At least one character class must be enabled in password mode.
- If “require each class” is enabled, length must be >= number of enabled classes.

### 6.5 Bounds
- Password length min: 8
- Password length max: 128
- Passphrase word count min: 3
- Passphrase word count max: 10
These are UI constraints; core should still validate.

### 6.6 Passphrase mode rules (if enabled)
- Wordlist must be embedded locally (no network).
- Word selection must be uniform using secure RNG.
- Optional transforms:
  - Capitalize first letter of each word
  - Randomly capitalize one word
  - Append a digit block of length 2 (optional)
- If adding digits/symbols, define exact behavior to keep it predictable.

## 7. Persistence

### 7.1 What to persist
Persist only user settings (toggles, length, mode) in `localStorage`.

### 7.2 What NOT to persist
- Generated passwords / passphrases must never be stored.
- Clipboard contents must not be stored.

### 7.3 Reset
Provide a “Reset settings” action that clears stored preferences.

## 8. Accessibility

- All interactive controls reachable via Tab.
- Labels must be explicit and associated with inputs.
- Output field must be announced properly (role/label).
- Copy confirmation must be announced via `aria-live="polite"`.
- Ensure sufficient contrast in default theme.
- Support prefers-reduced-motion.

## 9. Transparency / Trust

### 9.1 “View source”
Provide a visible link:
- To repository (GitHub) and
- To a specific file/section for the generator implementation.

### 9.2 No third-party resources
- No third-party scripts, trackers, fonts, analytics.
- If any are introduced, they must be explicitly documented and justified.

## 10. Performance / Size Budgets

Set explicit budgets (enforced by CI if possible):
- Initial HTML: small
- Shipped JS: target <= 10 KB gzip (excluding framework runtime if any; ideally include total)
- No large images; ideally none.

## 11. Tech / Architecture

### 11.1 Development stack
- Astro + TypeScript + Tailwind CSS
- One client “island” for interactive UI
- Core logic in a framework-agnostic module (`src/core`)

### 11.2 Core module API
- `generatePassword(options): string`
- `generatePassphrase(options): string` (if enabled)
- `estimateEntropy(options): number`
- `normalizeOptions(options): NormalizedOptions`
- `validateOptions(options): ValidationResult`

Core must be dependency-free and testable with an injected RNG for tests:
- `rngBytes(len): Uint8Array`

## 12. Testing

Minimum tests for core:
- Validates rejection sampling (no modulo bias implementation regression; test structural behavior)
- Ensures “require each class” guarantee
- Ensures shuffle changes order distribution (basic sanity)
- Ensures invalid configs throw or normalize as specified
- Snapshot tests for normalized options

CI checks:
- typecheck
- lint
- unit tests
- build

## 13. Pages / Content (MVP)

- `/` generator
- `/security` short guidance:
  - local generation, offline capable
  - don’t use on compromised devices
  - prefer password managers
- `/privacy` one-screen statement: no tracking, no network calls required

## 14. Release / Deployment

- Static hosting on Cloudflare Pages.
- Show build commit hash in footer.
- Tag releases; optionally publish a single-file HTML artifact.

## 15. Definition of Done (MVP)

- Generates passwords per defaults
- Copy/regenerate works with keyboard and mouse
- No third-party network requests after initial load
- Core generator is unit-tested and bias-safe
- Accessibility basics validated (keyboard + screen reader announcements)
- Security/privacy pages exist
- CI green, deploy hooked to main branch
