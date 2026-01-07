# Repository Guidelines

## Project Structure & Module Organization
- `src/core/` contains the framework-agnostic password generation logic and utilities.
- `src/core/__tests__/` holds unit and property tests for core behavior.
- `src/pages/` contains Astro pages (e.g., `src/pages/index.astro`).
- `public/` is for static assets served as-is.
- `SPEC.md` documents product goals, security/privacy constraints, and core rules.

## Build, Test, and Development Commands
- `npm run dev`: start the local Astro dev server.
- `npm run build`: generate the production build.
- `npm run preview`: serve the production build locally.
- `npm run test`: run the Vitest suite once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run test:coverage`: run tests with coverage via `@vitest/coverage-v8`.
- `npm run typecheck`: run `tsc --noEmit` for static checks.

## Coding Style & Naming Conventions
- Use TypeScript with 2-space indentation and semicolons, matching existing files in `src/core`.
- Prefer small, pure functions in `src/core` with explicit types and dependency-free logic.
- Keep public APIs named exports from `src/core/index.ts`.
- Tests follow `*.test.ts` naming and live in `src/core/__tests__/`.

## Testing Guidelines
- Frameworks: Vitest + fast-check (property tests).
- Focus on deterministic, bias-safe behavior (see `SPEC.md` §6).
- Run `npm run test` for unit tests and `npm run test:coverage` before PRs.
- Coding agents must run `npm run test` after every change.

## Commit & Pull Request Guidelines
- Commit messages are short, imperative, and lowercase (examples in history: "add core module").
- PRs should include a concise summary, testing notes, and screenshots for UI changes.
- Link relevant issues or spec sections when behavior changes touch `SPEC.md` requirements.

## Security & Privacy Notes
- All generation must remain client-side; no logging of generated passwords.
- Avoid introducing third-party scripts or network calls (see `SPEC.md` §2 and §9).
