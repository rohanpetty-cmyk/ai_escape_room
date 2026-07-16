import { gameDefinitionSchema } from "./schemas";
import type { GameDefinition } from "./types";

export function extractJsonObject(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  if (withoutFence.startsWith("{") && withoutFence.endsWith("}")) {
    return withoutFence;
  }

  const first = withoutFence.indexOf("{");
  const last = withoutFence.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found.");
  }

  return withoutFence.slice(first, last + 1);
}

export function parseGameJson(text: string) {
  const json = JSON.parse(extractJsonObject(text));
  return gameDefinitionSchema.parse(json);
}

export function validateGeneratedGame(game: GameDefinition) {
  if (game.mode !== "generated") {
    return 'Generated rooms must use mode "generated".';
  }

  if (game.rooms.length !== 3) {
    return "Generated rooms must include exactly three rooms.";
  }

  const roomIds = new Set(game.rooms.map((room) => room.id));
  if (!roomIds.has(game.startRoomId)) {
    return "startRoomId must match one room id.";
  }

  const puzzleIds = new Set(game.rooms.map((room) => room.puzzle.id));
  for (const puzzleId of game.finalEscape.requiredPuzzleIds) {
    if (!puzzleIds.has(puzzleId)) {
      return `finalEscape.requiredPuzzleIds includes unknown puzzle: ${puzzleId}`;
    }
  }

  const itemIds = new Set(
    game.rooms.flatMap((room) => room.items.map((item) => item.id)),
  );

  for (const room of game.rooms) {
    for (const requiredItemId of room.puzzle.requiredItemIds ?? []) {
      if (!itemIds.has(requiredItemId)) {
        return `${room.puzzle.id} requires unknown item ${requiredItemId}.`;
      }
    }

    if (
      room.puzzle.unlocksExitId &&
      !room.exits.some((exit) => exit.id === room.puzzle.unlocksExitId)
    ) {
      return `${room.puzzle.id} unlocks an exit that is not in its room.`;
    }

    for (const exit of room.exits) {
      if (exit.toRoomId && !roomIds.has(exit.toRoomId)) {
        return `${exit.id} points to unknown room ${exit.toRoomId}.`;
      }
      if (exit.lockedByPuzzleId && !puzzleIds.has(exit.lockedByPuzzleId)) {
        return `${exit.id} is locked by unknown puzzle ${exit.lockedByPuzzleId}.`;
      }
    }
  }

  const finalRoom = game.rooms.find(
    (room) => room.id === game.finalEscape.escapeRoomId,
  );
  if (
    !finalRoom?.exits.some((exit) => exit.id === game.finalEscape.escapeExitId)
  ) {
    return "Final escape exit must exist in the final room.";
  }

  return null;
}
