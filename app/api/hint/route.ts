import { NextResponse } from "next/server";
import { sampleGame } from "@/lib/sample-game";
import { hintRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = hintRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "roomId and puzzleId are required." },
      { status: 400 },
    );
  }

  const room = sampleGame.rooms.find(
    (candidate) => candidate.id === parsed.data.roomId,
  );
  const puzzle = room?.puzzle.id === parsed.data.puzzleId ? room.puzzle : null;

  if (!puzzle) {
    return NextResponse.json(
      { error: "No matching puzzle found in the sample game." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    placeholder: true,
    message:
      "Hint API is scaffolded only. The current app reveals hints locally from the sample game.",
    hints: puzzle.hints,
  });
}
