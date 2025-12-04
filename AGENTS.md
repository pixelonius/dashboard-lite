# Repository Guidelines

## Project Structure & Module Organization
- `client/` — Vite + React app. Source under `client/src` (components, pages, hooks, lib); static assets in `client/public`.
- `server/` — Express + TypeScript (see `routes.ts`, `middleware/`, `services/`, `utils/`, `lib/`). Serves the client in production.
- `shared/` — Cross‑cutting types and Zod schemas shared by client/server.
- `prisma/` — Database schema and migrations (`schema.prisma`, `migrations/`, `seed.ts`).
- Config: `vite.config.ts`, `tailwind.config.ts`, `drizzle.config.ts`, `.env(.example)`.

## Build, Test, and Development Commands
- `npm run dev` — Start the API in development (tsx) and attach Vite middleware for the client.
- `npm run build` — Build client with Vite and bundle the server to `dist/` via esbuild.
- `npm start` — Run compiled server (`dist/index.js`) and serve the built client.
- `npm run check` — TypeScript type‑check.
- `npm run db:push` — Apply Drizzle schema changes to the database.

## Coding Style & Naming Conventions
- TypeScript everywhere; 2‑space indentation; keep semicolons; prefer ES modules.
- React components: PascalCase (e.g., `AppSidebar.tsx`); UI primitives under `client/src/components/ui` are kebab‑case (e.g., `button.tsx`).
- Server files are lowercase (e.g., `routes.ts`, `db.ts`); functions camelCase; types/interfaces PascalCase.
- Tailwind for styling; reuse primitives in `components/ui/`. Align visuals with `design_guidelines.md`.

## Testing Guidelines
- No formal test suite currently. If adding tests:
  - Client: Vitest + React Testing Library; co‑locate as `*.test.tsx` under `client/src`.
  - Server: Vitest/Jest + supertest; place `*.test.ts` near sources in `server/`.
- Keep tests deterministic; focus on routes, auth, and critical UI flows.

## Commit & Pull Request Guidelines
- Use clear, imperative messages (e.g., "Add student check‑in view"). Reference issues (`Closes #123`) when applicable.
- PRs include: concise description, screenshots/GIFs for UI, environment or migration notes, and a brief test plan.
- Avoid unrelated refactors in feature/fix PRs; keep diffs focused.

## Security & Configuration Tips
- Copy `.env.example` to `.env`; set `DATABASE_URL`, session secrets, and any mail/API keys. Never commit `.env`.
- Apply schema with `npm run db:push`. Use Neon/pg connection strings for `DATABASE_URL`.
- On production, use `npm run build` then `npm start`.

