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

The app works without an AI key by using demo mode and a reliable fallback game.

## AI Provider Setup

Use OpenAI:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4.1-mini
```

Or use Claude:

```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

If `AI_PROVIDER` is omitted, the app tries `OPENAI_API_KEY` first, then
`ANTHROPIC_API_KEY`, then falls back to local deterministic content.

## Architecture

- `lib/game/engine.ts` owns all deterministic state changes.
- `lib/ai/provider.ts` selects OpenAI, Claude, or local fallback.
- `app/api/games/generate/route.ts` generates and validates room definitions.
- `app/api/actions/interpret/route.ts` maps player text to structured intents.
- `state/gameStore.ts` persists game state to `localStorage`.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build and verify the rendered app shell
- `npm run lint`: run ESLint

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
