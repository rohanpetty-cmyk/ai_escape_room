import type { GameGenerationPromptInput } from "./prompts";
import type { GameState, Room } from "./types";

export const AI_REQUEST_TIMEOUT_MS = 20_000;

export function stripMarkdownCodeFences(value: string): string {
  const trimmed = value.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return (fenceMatch?.[1] ?? trimmed).trim();
}

export function parseJson(value: string):
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
    } {
  try {
    return {
      ok: true,
      value: JSON.parse(value) as unknown,
    };
  } catch {
    return {
      ok: false,
    };
  }
}

export function temperatureForDifficulty(
  difficulty: GameGenerationPromptInput["difficulty"],
) {
  if (difficulty === "easy") return 0.2;
  if (difficulty === "hard") return 0.5;

  return 0.35;
}

export function validateGeneratedGame(
  game: GameState,
  input: GameGenerationPromptInput,
): string[] {
  const issues: string[] = [];
  const expectedRoomCount = input.demoMode ? 1 : 3;

  if (game.rooms.length !== expectedRoomCount) {
    issues.push(`Expected exactly ${expectedRoomCount} room(s).`);
  }

  if (game.demoMode !== input.demoMode) {
    issues.push("demoMode does not match the request.");
  }

  if (!game.rooms.some((room) => room.id === game.currentRoomId)) {
    issues.push("currentRoomId does not refer to an existing room.");
  }

  if (game.status !== "playing") {
    issues.push("Generated game status must be playing.");
  }

  if (
    game.inventory.length > 0 ||
    game.discoveredClueIds.length > 0 ||
    game.solvedPuzzleIds.length > 0
  ) {
    issues.push("Generated progress fields must start empty.");
  }

  const idRegistry = new Set<string>();
  const roomIds = new Set(game.rooms.map((room) => room.id));
  const puzzleIds = new Set(game.rooms.map((room) => room.puzzle.id));
  const collectibleItemIds = new Set(
    game.rooms.flatMap((room) =>
      room.objects.flatMap((object) =>
        object.collectibleItemId ? [object.collectibleItemId] : [],
      ),
    ),
  );

  registerId(idRegistry, issues, game.id, "game");

  game.rooms.forEach((room, index) => {
    validateRoom(room, index, idRegistry, roomIds, puzzleIds, collectibleItemIds, issues);
  });

  game.objectives.forEach((objective) => {
    registerId(idRegistry, issues, objective.id, "objective");
    if (objective.completed) {
      issues.push(`Objective ${objective.id} must start incomplete.`);
    }
  });

  game.narrativeHistory.forEach((entry) => {
    registerId(idRegistry, issues, entry.id, "narrative entry");
  });

  const finalExitCount = game.rooms.reduce(
    (count, room) => count + room.exits.filter((exit) => exit.final).length,
    0,
  );

  if (finalExitCount < 1) {
    issues.push("Generated game must include at least one final exit.");
  }

  if (!input.demoMode) {
    if (collectibleItemIds.size < 3) {
      issues.push("Normal mode must include at least three collectible items.");
    }

    const hasLaterRequiredItem = game.rooms.some((room, roomIndex) =>
      room.objects.some((object) => {
        if (!object.requiredItemId) return false;

        return game.rooms
          .slice(0, roomIndex)
          .some((previousRoom) =>
            previousRoom.objects.some(
              (previousObject) =>
                previousObject.collectibleItemId === object.requiredItemId,
            ),
          );
      }),
    );

    if (!hasLaterRequiredItem) {
      issues.push("Normal mode must require at least one earlier item later.");
    }

    const finalRoom = game.rooms.at(-1);
    if (!finalRoom?.exits.some((exit) => exit.final)) {
      issues.push("Normal mode final exit must be in the third room.");
    }
  }

  return issues;
}

function validateRoom(
  room: Room,
  index: number,
  idRegistry: Set<string>,
  roomIds: Set<string>,
  puzzleIds: Set<string>,
  collectibleItemIds: Set<string>,
  issues: string[],
) {
  registerId(idRegistry, issues, room.id, `room ${index + 1}`);
  registerId(idRegistry, issues, room.puzzle.id, `puzzle in ${room.id}`);

  if (room.completed) {
    issues.push(`Room ${room.id} must start incomplete.`);
  }

  if (room.puzzle.solved) {
    issues.push(`Puzzle ${room.puzzle.id} must start unsolved.`);
  }

  if (room.puzzle.hintLevels.length !== 3) {
    issues.push(`Puzzle ${room.puzzle.id} must have exactly three hints.`);
  }

  if (room.puzzle.clueIds.length < 2) {
    issues.push(`Puzzle ${room.puzzle.id} must reference at least two clues.`);
  }

  const clueIds = new Set(room.clues.map((clue) => clue.id));

  room.clues.forEach((clue) => {
    registerId(idRegistry, issues, clue.id, `clue in ${room.id}`);
  });

  room.puzzle.clueIds.forEach((clueId) => {
    if (!clueIds.has(clueId)) {
      issues.push(`Puzzle ${room.puzzle.id} references missing clue ${clueId}.`);
    }
  });

  room.objects.forEach((object) => {
    registerId(idRegistry, issues, object.id, `object in ${room.id}`);

    if (object.collectibleItemId) {
      registerId(idRegistry, issues, object.collectibleItemId, `item in ${room.id}`);
    }

    if (object.requiredItemId && !collectibleItemIds.has(object.requiredItemId)) {
      issues.push(`Object ${object.id} requires unknown item ${object.requiredItemId}.`);
    }

    object.discoveredClueIds.forEach((clueId) => {
      if (!clueIds.has(clueId)) {
        issues.push(`Object ${object.id} references missing clue ${clueId}.`);
      }
    });
  });

  room.exits.forEach((exit) => {
    registerId(idRegistry, issues, exit.id, `exit in ${room.id}`);

    if (!exit.final && (!exit.toRoomId || !roomIds.has(exit.toRoomId))) {
      issues.push(`Exit ${exit.id} must point to an existing room.`);
    }

    if (exit.requiredPuzzleId && !puzzleIds.has(exit.requiredPuzzleId)) {
      issues.push(`Exit ${exit.id} requires unknown puzzle ${exit.requiredPuzzleId}.`);
    }
  });
}

function registerId(
  registry: Set<string>,
  issues: string[],
  id: string,
  label: string,
) {
  if (!isUrlSafeId(id)) {
    issues.push(`${label} id is not URL-safe: ${id}.`);
  }

  if (registry.has(id)) {
    issues.push(`Duplicate id found: ${id}.`);
    return;
  }

  registry.add(id);
}

function isUrlSafeId(id: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
}
