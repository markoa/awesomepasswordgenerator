# Awesome Password Generator

A minimal, open source password generator that runs entirely in your browser.  
No tracking, no ads, no network calls required to generate.

Live: [awesomepasswordgenerator.com](https://awesomepasswordgenerator.com).

## Why it exists
I got tired of using bloated password generator sites. I wanted a simple, trustworthy tool I could share with anyone.

## Quick start
```sh
npm install
npm run dev
```

## Tests
```sh
npm run test
```

Built with Astro, React, Tailwind CSS, and TypeScript.

PWA-ready: install it on your device and use it offline.

Deploys on Cloudflare Pages after running the test suite.

## Security & privacy
- Passwords are generated locally (client‑side only).
- No logging, no analytics, no third‑party scripts.
- Generated passwords are never stored; only your settings can be saved locally.
- Use only on devices you trust.

## How it works
- Uses `crypto.getRandomValues` for randomness.
- Avoids modulo bias via rejection sampling.
- Can require at least one character from each selected class.
- Shuffles output uniformly.

See `SPEC.md` for the full security, privacy, and behavior requirements.

## License
MIT
