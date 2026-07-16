import { NextResponse } from "next/server";
import { askAi, getConfiguredAiProvider } from "@/lib/ai/provider";
import { actionInterpretationPrompt } from "@/lib/ai/prompts";
import { parsePlayerActionText } from "@/lib/game/engine";
import {
  interpretActionRequestSchema,
  playerActionIntentSchema,
} from "@/lib/game/schemas";
import { extractJsonObject } from "@/lib/game/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = interpretActionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a player action." },
      { status: 400 },
    );
  }

  const provider = getConfiguredAiProvider();

  if (!provider) {
    return NextResponse.json({
      intent: parsePlayerActionText(parsed.data.text),
      source: "local",
    });
  }

  try {
    const raw = await askAi(actionInterpretationPrompt(parsed.data), 700);
    if (!raw) throw new Error("The AI provider returned no action.");

    const intent = playerActionIntentSchema.parse(
      JSON.parse(extractJsonObject(raw)),
    );

    return NextResponse.json({ intent, source: provider });
  } catch (error) {
    console.error("Action interpretation failed", error);
    return NextResponse.json({
      intent: parsePlayerActionText(parsed.data.text),
      source: "local",
    });
  }
}
