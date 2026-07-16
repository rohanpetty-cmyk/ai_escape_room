import { NextResponse } from "next/server";
import { askAi, getConfiguredAiProvider } from "@/lib/ai/provider";
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
  const provider = getConfiguredAiProvider();

  if (!provider) {
    return NextResponse.json({
      game: fallback,
      source: "fallback",
      warning:
        "No AI provider is configured locally, so a reliable fallback room was loaded.",
    });
  }

  try {
    const raw = await askAi(gameGenerationPrompt(theme), 4200);
    if (!raw) throw new Error("The AI provider returned no content.");

    let game = parseGameJson(raw);
    let gameIssue = validateGeneratedGame(game);

    if (gameIssue) {
      const repaired = await askAi(
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
          "The AI provider returned a room that did not pass validation, so a safe fallback was loaded.",
      });
    }

    return NextResponse.json({ game, source: provider });
  } catch (error) {
    console.error("Game generation failed", error, summarizeGameForRepair(fallback));
    return NextResponse.json({
      game: fallback,
      source: "fallback",
      warning: "AI generation failed, so a safe fallback was loaded.",
    });
  }
}
