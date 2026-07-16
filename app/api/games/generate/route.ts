import { NextResponse } from "next/server";
import { askClaude, hasAnthropicApiKey } from "@/lib/ai/anthropic";
import {
  gameGenerationPrompt,
  repairGamePrompt,
  summarizeGameForRepair,
} from "@/lib/ai/prompts";
import { makeFallbackGeneratedGame } from "@/lib/game/demoGame";
import { generateGameRequestSchema } from "@/lib/game/schemas";
import { parseGameJson, validateGeneratedGame } from "@/lib/game/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = generateGameRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a theme between 3 and 120 characters." },
      { status: 400 },
    );
  }

  const { theme } = parsed.data;
  const fallback = makeFallbackGeneratedGame(theme);

  if (!hasAnthropicApiKey()) {
    return NextResponse.json({
      game: fallback,
      source: "fallback",
      warning:
        "Claude is not configured locally, so a reliable fallback room was loaded.",
    });
  }

  try {
    const raw = await askClaude(gameGenerationPrompt(theme), 4200);
    if (!raw) throw new Error("Claude returned no content.");

    let game = parseGameJson(raw);
    let gameIssue = validateGeneratedGame(game);

    if (gameIssue) {
      const repaired = await askClaude(
        repairGamePrompt(theme, raw, gameIssue),
        4200,
      );
      if (repaired) {
        game = parseGameJson(repaired);
        gameIssue = validateGeneratedGame(game);
      }
    }

    if (gameIssue) {
      return NextResponse.json({
        game: fallback,
        source: "fallback",
        warning:
          "Claude returned a room that did not pass validation, so a safe fallback was loaded.",
      });
    }

    return NextResponse.json({ game, source: "claude" });
  } catch (error) {
    console.error("Game generation failed", error, summarizeGameForRepair(fallback));
    return NextResponse.json({
      game: fallback,
      source: "fallback",
      warning: "Claude generation failed, so a safe fallback was loaded.",
    });
  }
}
