# Repository Guidelines

## Project Structure & Module Organization

This frontend-only Thai learning app illustrates OneApp ↔ ECAS TLS/mTLS using React 19, TypeScript, and Vite. `src/App.tsx` assembles the workspace; `src/components/` contains chapters and shared UI. Keep lesson fixtures and Java examples in `src/data/`, deterministic protocol logic in `src/lib/handshake.ts`, and playback lifecycle in `src/hooks/useHandshake.ts`. Global styling lives in `src/styles.css`; static assets belong in `public/`. Tests live in `tests/`; browser verification notes and screenshots are under `docs/`. Treat `dist/` as generated output.

## Build, Test, and Development Commands

Use Node.js 22.12+ or 24 with npm.

- `npm ci`: install dependencies from the committed lockfile.
- `npm run dev`: start Vite on localhost, normally `http://127.0.0.1:5173`.
- `npm run build`: run TypeScript checks and generate `dist/`.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint, including TypeScript and React Hooks rules.
- `npm test`: run the Vitest suites once in jsdom.

## Coding Style & Naming Conventions

Follow existing two-space indentation, single quotes, and omitted semicolons. Use PascalCase component filenames, camelCase functions and variables, and `use`-prefixed hooks. TypeScript is strict and rejects unused locals and parameters. Keep protocol transitions pure and timer cleanup in the hook. Preserve Thai-first explanations and accessible controls. Prettier is installed, but no formatting script is configured.

## Testing Guidelines

Name tests `tests/*.test.ts` or `tests/*.test.tsx`. Use Vitest for protocol invariants and React Testing Library for hook/UI behavior; fake timers cover playback. Cover affected TLS/mTLS, protocol-version, failure-gating, and pause/reset paths. No numeric coverage threshold is configured. Before proposing changes, run build, lint, and tests. For UI changes, check chapter navigation, themes, responsive layouts, and keyboard dialogs; record observed results and limitations in `docs/QA.md`.

## Commit & Pull Request Guidelines

This checkout has no Git metadata, so existing commit conventions cannot be verified. Use concise imperative subjects, such as `Fix playback reset cleanup`. PRs should explain the changed behavior, link applicable issues, list validation results, and include screenshots for visual changes.

## Security & Configuration

Keep certificates, hostnames, and passwords fictional. Never commit private keys or real credentials. Preserve the documented simulation boundaries: this app performs no real TLS validation or ECAS requests. Keep bundled assets local and generated files out of source changes.
