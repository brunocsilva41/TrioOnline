# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

TrioOnline (codename Trinity) is a deterministic multiplayer card game for 3 players. It uses Colyseus for real-time WebSocket sync, a shared core-engine that runs on both client and server for state reconciliation, and an autonomous multi-agent system for PR governance.

## Commands

```bash
pnpm install              # Install all workspaces
pnpm dev                  # Run all apps in dev mode (client :3000, server ws://localhost:2567)
pnpm build                # Build all packages via Turborepo
pnpm lint                 # ESLint across all workspaces
pnpm test                 # Jest tests (core-engine)
pnpm type-check           # TypeScript strict check all workspaces
pnpm db:generate          # Prisma client generation

# Per-workspace
pnpm --filter game-client dev
pnpm --filter game-server dev
pnpm --filter core-engine test

# Infrastructure
docker-compose up -d      # Local Postgres 15 + Redis 7
```

## Architecture

**Monorepo (pnpm workspaces + Turborepo):**

- `apps/game-client` — Next.js 14 (App Router), React 18, Zustand state, Framer Motion animations, Colyseus.js WebSocket client, Tailwind CSS
- `apps/game-server` — Node.js Colyseus server, Express health endpoints, Prisma ORM, Zod validation, Prometheus metrics
- `packages/core-engine` — Shared deterministic game logic (TurnStateMachine, DeckManager). Used by both client and server for state simulation and reconciliation
- `packages/db` — Prisma schema and migrations (PostgreSQL 15)

**Data flow:** Client sends commands via WebSocket → Server queues them FIFO → core-engine processes deterministically → Colyseus broadcasts binary state deltas → Client reconciles local state.

## The 5 Deterministic Laws (MANDATORY)

These rules from `/PLANNING/52_ENGINEERING_BIBLE/deterministic_multiplayer_laws.md` are non-negotiable:

1. **No `Math.random()`** in game logic — use seeded PRNG (`seedrandom` with Match_Seed)
2. **No `Date.now()`** in game logic — use integer Tick counters dispatched by server
3. **Immutable state transitions** — emit Action Objects (Event Sourcing); Colyseus schema mutates internally but replay log is appended
4. **Decoupled view** — backend returns pure state data, never UI commands
5. **Single-threaded FIFO queue** — no `Promise.all` for command processing in rooms; all commands processed sequentially to prevent race conditions

## Code Standards

- TypeScript strict mode, no `any`
- Composition over inheritance
- Test coverage >95% for `packages/core-engine`
- Branch naming: `feat/name` or `fix/name`
- Avoid unnecessary re-renders in React; use Zustand for global state

## Key Files

- `packages/core-engine/src/TurnStateMachine.ts` — Heart of game logic, tick-based turn progression
- `packages/core-engine/src/DeckManager.ts` — Deterministic card shuffling with seeded PRNG
- `apps/game-server/src/rooms/TrioRoom.ts` — Main Colyseus room (command handling, state sync)
- `apps/game-server/src/schemas/GameState.ts` — Colyseus schema definitions
- `apps/game-client/store/useGameStore.ts` — Client-side Zustand store
- `apps/game-client/networking/` — Colyseus client connection logic

## Agent System

13 autonomous agents review PRs (see `/AGENTS/index.md`). The Project Orchestrator is the final gatekeeper. QA Master enforces test coverage. Anti-Cheat agent validates the "Client Ignorance Pattern" (client never has authoritative state).

## Deployment

- **Local:** `docker-compose up -d` for Postgres + Redis
- **Production:** Render.com (render.yaml) or Kubernetes (`/infra/k8s/`)
- **Health check:** `GET /health` on game-server
- **Graceful shutdown:** 15-min drain for active matches during rolling updates
