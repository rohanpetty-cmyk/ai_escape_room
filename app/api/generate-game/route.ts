import { NextResponse } from "next/server";
import {
  generateGameWithProvider,
  getProviderStatus,
  resolveAIProvider,
  type ProviderGenerationFailure,
} from "@/lib/ai-provider";
import { demoGame, sampleGame } from "@/lib/sample-game";
import { aiProviderSchema } from "@/lib/schemas";
import { z } from "zod";

const requestSchema = z.object({
  theme: z.string().trim().min(3).max(120),
  difficulty: z.enum(["easy", "medium", "hard"]),
  demoMode: z.boolean(),
  provider: aiProviderSchema.optional(),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message:
            "Request must include theme, difficulty, and demoMode. Difficulty must be easy, medium, or hard.",
        },
      },
      { status: 400 },
    );
  }

  const provider = resolveAIProvider(parsed.data.provider);
  const result = await generateGameWithProvider(provider, parsed.data);

  if (result.ok) {
    return NextResponse.json({
      game: result.game,
      source: result.provider,
      provider: result.provider,
      fallback: false,
      ai: {
        configured: true,
        model: result.model,
        provider: result.provider,
      },
    });
  }

  const fallbackGame = parsed.data.demoMode ? demoGame : sampleGame;

  return NextResponse.json({
    game: fallbackGame,
    source: "fallback",
    provider: result.provider,
    fallback: true,
    error: publicGenerationError(result),
    ai: getProviderStatus(result.provider),
  });
}

function publicGenerationError(result: ProviderGenerationFailure) {
  return {
    code: result.code,
    message: result.message,
    issues: result.issues?.slice(0, 8),
  };
}
