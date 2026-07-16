import { NextResponse } from "next/server";
import { getClaudePlaceholderStatus } from "@/lib/claude";
import { buildGameGenerationPrompt } from "@/lib/prompts";
import { sampleGame } from "@/lib/sample-game";
import { z } from "zod";

const requestSchema = z.object({
  theme: z.string().trim().min(3).max(120).optional(),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Theme must be between 3 and 120 characters." },
      { status: 400 },
    );
  }

  const theme = parsed.data.theme ?? sampleGame.theme;

  return NextResponse.json(
    {
      error: "AI game generation is not connected yet.",
      placeholder: true,
      claude: getClaudePlaceholderStatus(),
      promptPreview: buildGameGenerationPrompt(theme),
      sampleGame,
    },
    { status: 501 },
  );
}
