import { NextResponse } from "next/server";
import { playerActionSchema } from "@/lib/schemas";
import type { PlayerActionIntent } from "@/lib/types";

function previewActionIntent(command: string): PlayerActionIntent {
  const normalized = command.toLowerCase().trim();

  if (normalized.startsWith("inspect ") || normalized.startsWith("read ")) {
    return "INSPECT";
  }

  if (normalized.startsWith("take ") || normalized.startsWith("get ")) {
    return "TAKE";
  }

  if (normalized.startsWith("answer ") || normalized.startsWith("enter ")) {
    return "ANSWER";
  }

  if (
    normalized.startsWith("go ") ||
    normalized.startsWith("move ") ||
    normalized === "exit"
  ) {
    return "MOVE";
  }

  if (normalized === "hint") {
    return "REQUEST_HINT";
  }

  if (normalized === "look" || normalized === "look around") {
    return "LOOK";
  }

  return "UNKNOWN";
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = playerActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Command is required and must be under 180 characters." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    placeholder: true,
    message:
      "Player action API is scaffolded only. The current app applies commands locally with the deterministic game engine.",
    localIntentPreview: {
      intent: previewActionIntent(parsed.data.command),
      command: parsed.data.command,
    },
  });
}
