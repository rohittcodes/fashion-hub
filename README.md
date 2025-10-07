# Fashion Hub

![license: MIT](https://img.shields.io/badge/license-MIT-green)
![build](https://img.shields.io/badge/build-pnpm%20turbo-blue)
![type safety](https://img.shields.io/badge/types-TypeScript-informational)

Vibe Shop is a modern e‑commerce monorepo showcasing a production‑ready personalization stack. It combines a Next.js web app, an Expo mobile app, and a type‑safe API layer to deliver personalized product recommendations, rich product browsing, and fast, maintainable developer workflows built using [Rube MCP](https://rube.app).

<p align="center">
  <em>Personalized recommendations • Type‑safe APIs • Web + Native • Modern DX</em>
</p>

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Recommendations Engine](#recommendations-engine)
- [Installation](#installation)
- [Usage](#usage)
- [Development Scripts](#development-scripts)
- [Quality (Lint, Types)](#quality-lint-types)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
  
> Quick links: [Install](#5-installation) · [Run Web](#6-usage) · [Run Mobile](#6-usage) · [API](#4-recommendations-engine)

## Project Overview

Fashion Hub delivers a catalog, product detail pages, cart/checkout flows, and three recommendation surfaces:
- For You (personalized)
- Trending Now (popular right now)
- Similar Items (contextual on PDP)

Recommendations are powered by lightweight signal aggregation (views, wishlist, cart, purchases) and efficient product projection returned over a type‑safe tRPC API.

## Features

- Personalized recommendations with user‑aware signals
- Trending products using recent activity (with cart/order fallback)
- Similar items on product pages
- Accessible UI with skeletons, error, and empty states
- End‑to‑end type safety (tRPC v11 + React Query)
- Shared UI and tooling across apps (Tailwind, ESLint, TS, Prettier)

Optional niceties you can add:
- Screenshots/GIFs of the home page, PDP, and recs sections
- Badges for CI, coverage, and package versions

## Architecture

- Web (apps/nextjs): Next.js (App Router), React 19, Tailwind, tRPC, React Query
- Mobile (apps/expo): Expo, NativeWind; uses shared types for DX
- API (packages/api): tRPC router, Drizzle ORM, recommendation service
- DB (packages/db): Drizzle + edge‑compatible Postgres driver
- Auth (packages/auth): better‑auth configuration and schema generation
- UI (packages/ui): shared components (shadcn‑ui primitives)

Monorepo management via Turborepo; shared presets in tooling/*.

### Monorepo Structure

```text
apps/
  nextjs/         # Web app (Next.js)
  expo/           # Mobile app (Expo)
packages/
  api/            # tRPC router, recs service
  auth/           # Better‑Auth config & schema generation
  db/             # Drizzle ORM and schema
  ui/             # Shared UI components
tooling/          # ESLint/TS/Tailwind/Prettier presets
```

## Recommendations Engine

Key locations:
- Router: `packages/api/src/router/recommendation.ts`
- Service: `packages/api/src/recommendation/service.ts`
- Repository: `packages/api/src/recommendation/repository.ts`
- Content similarity: `packages/api/src/recommendation/content-similarity.ts`

Endpoints:
- `recommendation.forYou({ limit })` — personalized by recent user signals
- `recommendation.trending({ limit })` — recent interactions with cart/order fallback
- `recommendation.similar({ productId, limit })` — product‑anchored suggestions
- `recommendation.trackInteraction({ productId, interactionType, weight?, metadata? })`

UI integration:
- Sections component: `apps/nextjs/src/app/_components/recommendations.tsx`
  - For You, Trending Now, Similar Items (Suspense + queryOptions)
- Product card/grid: `apps/nextjs/src/app/_components/products.tsx`
- Tracking hook: `apps/nextjs/src/lib/recommendations.ts` (dedups view events)

Data flow:
1) Client fires `trackInteraction` (view/cart/purchase/wishlist)
2) API stores weighted signals
3) Aggregation ranks product IDs; minimal product projection returned
4) UI renders sections with a11y states and lazy fetch

## Installation

Prerequisites: Node (per package.json engines), pnpm, Postgres (or Vercel Postgres), and a .env file.

```bash
# Install dependencies
pnpm i

# Configure environment variables
cp .env.example .env  # then fill values

# Push the Drizzle schema
pnpm db:push

# Generate Better‑Auth database schema
pnpm --filter @acme/auth generate
```

### Environment Variables

Create `.env` at the repo root. Common variables:

```bash
# Database
POSTGRES_URL=...

# Better‑Auth
AUTH_SECRET=...
AUTH_DISCORD_ID=...
AUTH_DISCORD_SECRET=...
AUTH_BASE_URL=http://localhost:3000
AUTH_PRODUCTION_URL=https://your-domain.com

# Expo (mobile)
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
```

## Usage

Run the web app (Next.js):
```bash
pnpm --filter @acme/nextjs dev
```

Run the mobile app (Expo):
```bash
pnpm --filter @acme/expo dev
```

Notes:
- Update `apps/expo/src/utils/base-url.ts` to point to your LAN or production API URL.
- For OAuth in preview/development, prefer Better‑Auth proxy.

### Common Issues

- If the Edge runtime complains about Node‑only modules in middleware, keep middleware minimal and enforce RBAC server‑side in routes.
- If mobile cannot reach your API, verify LAN IP and firewall settings.

## Development Scripts

Common scripts:
- `pnpm db:push` — apply Drizzle schema
- `pnpm --filter @acme/auth generate` — generate auth schema
- `pnpm --filter @acme/nextjs dev` — Next.js dev server
- `pnpm --filter @acme/expo dev` — Expo dev server

Formatting and linting:
```bash
pnpm fmt    # Prettier
pnpm lint   # ESLint
pnpm typecheck
```

## Quality (Lint, Types)

- Lint (shared presets under tooling/eslint):
```bash
pnpm lint
```
- Typecheck across packages:
```bash
pnpm typecheck
```

## Deployment

Web (Next.js):
- Deploy `apps/nextjs` to Vercel; set required env vars (e.g., `POSTGRES_URL`).
- Use your deployed domain for the Expo base URL in production.

Mobile (Expo):
- Use EAS Build/Submit for `apps/expo`.
- Ensure `getBaseUrl` points to the deployed web API.

### Security & Data

- Store secrets in platform key managers (Vercel env, EAS secrets)
- Add SAST/DAST and dependency scanning in CI for production use

## Contributing

PRs welcome. Please:
- Match existing code style (see tooling/*)
- Keep functions small and readable
- Favor explicit types and minimal comments that explain non‑obvious rationale

Suggested workflow:
- Create a feature branch
- Write focused commits with descriptive messages
- Ensure `pnpm lint` and `pnpm typecheck` pass
- Open a PR with a short description and screenshots when relevant

## License

MIT — see [LICENSE](LICENSE).

## Contact

Questions or suggestions?
- Open an issue in this repo
- Or reach out via your preferred channel

---

This repository is based on create‑t3‑turbo and extends it with a real‑world recommendations system for Fashion Hub.
