# AI Escape Room

A local-first AI escape room game built with Next.js App Router, TypeScript,
Tailwind CSS, Zod, Zustand, and deterministic game-state validation.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app runs immediately with a static sample escape room. Claude is installed
and scaffolded, but it is intentionally not connected yet.

## Claude Setup Later

The current scaffold does not call Claude. When generation is connected later,
use:

```bash
ANTHROPIC_API_KEY=your_claude_key
```

## Architecture

- `lib/game-engine.ts` owns deterministic state changes.
- `lib/sample-game.ts` provides the static playable escape room.
- `lib/schemas.ts` defines Zod contracts for future AI-generated JSON.
- `lib/claude.ts` confirms the Claude SDK is installed but not connected.
- `app/api/generate-game/route.ts` is a generation placeholder.
- `app/api/player-action/route.ts` is a player-action placeholder.
- `app/api/hint/route.ts` is a hint placeholder.
- `state/adventureStore.ts` stores and refresh-recovers local game progress.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm run typecheck`: run strict TypeScript checking
- `npm test`: build and verify the rendered app shell
- `npm run lint`: run ESLint

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
