import { NextResponse } from "next/server";
import {
  generateGameWithClaude,
  getClaudeStatus,
  type ClaudeGenerationFailure,
} from "@/lib/claude";
import { demoGame, sampleGame } from "@/lib/sample-game";
import { z } from "zod";

const requestSchema = z.object({
  theme: z.string().trim().min(3).max(120),
  difficulty: z.enum(["easy", "medium", "hard"]),
  demoMode: z.boolean(),
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

  const result = await generateGameWithClaude(parsed.data);

  if (result.ok) {
    return NextResponse.json({
      game: result.game,
      source: "claude",
      fallback: false,
      claude: {
        configured: true,
        model: result.model,
      },
    });
  }

  const fallbackGame = parsed.data.demoMode ? demoGame : sampleGame;

  return NextResponse.json({
    game: fallbackGame,
    source: "fallback",
    fallback: true,
    error: publicGenerationError(result),
    claude: getClaudeStatus(),
  });
}

function publicGenerationError(result: ClaudeGenerationFailure) {
  return {
    code: result.code,
    message: result.message,
    issues: result.issues?.slice(0, 8),
  };
}
