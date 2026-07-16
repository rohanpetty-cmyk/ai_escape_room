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

The app runs immediately with a static sample escape room. The generation route
can call Claude when configured, and otherwise stays demo-ready with the static
fallback.

## Claude Setup

Game generation and Dungeon Master action interpretation can call Claude or
OpenAI from server-side API routes. Keep these values in your local environment,
not in client code:

```bash
AI_PROVIDER=claude # or openai
ANTHROPIC_API_KEY=your_claude_key
CLAUDE_MODEL=claude-sonnet-4-5-20250929
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4.1-mini
```

The in-game provider selector lets you switch between Claude and OpenAI for
Dungeon Master actions. If the selected provider is not configured, game
generation returns the static sample or demo game as a fallback and player
actions use deterministic local action handling. Malformed AI action responses
are rejected so the current game state is preserved.

## Architecture

- `lib/game-engine.ts` owns deterministic state changes.
- `lib/sample-game.ts` provides the static playable escape room.
- `lib/schemas.ts` defines Zod contracts for AI-generated JSON.
- `lib/ai-provider.ts` selects the active AI provider.
- `lib/claude.ts` and `lib/openai.ts` call provider SDKs, parse JSON, and
  validate generated games and Dungeon Master action responses.
- `app/api/generate-game/route.ts` validates generation requests and returns
  Claude output or a static fallback.
- `app/api/player-action/route.ts` sends minimal room context to Claude and
  applies only deterministic engine-validated effects.
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
