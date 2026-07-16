import { NextResponse } from "next/server";
import { playerActionSchema } from "@/lib/schemas";
import type { CommandKind } from "@/lib/types";

function previewCommandKind(command: string): CommandKind {
  const normalized = command.toLowerCase().trim();

  if (normalized.startsWith("inspect ") || normalized.startsWith("read ")) {
    return "inspect";
  }

  if (normalized.startsWith("take ") || normalized.startsWith("get ")) {
    return "take";
  }

  if (normalized.startsWith("answer ") || normalized.startsWith("enter ")) {
    return "answer";
  }

  if (
    normalized.startsWith("go ") ||
    normalized.startsWith("move ") ||
    normalized === "exit"
  ) {
    return "move";
  }

  if (normalized === "hint") {
    return "hint";
  }

  if (normalized === "look" || normalized === "look around") {
    return "look";
  }

  return "unknown";
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
      kind: previewCommandKind(parsed.data.command),
      command: parsed.data.command,
    },
  });
}
