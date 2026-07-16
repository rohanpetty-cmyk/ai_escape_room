import type { GameGenerationPromptInput } from "./prompts";
import { gameStateSchema } from "./schemas";
import type { GameState, Room } from "./types";

export const AI_ACTION_TIMEOUT_MS = 20_000;
export const AI_GENERATION_TIMEOUT_MS = 120_000;

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

export type GameResponseValidationResult =
  | {
      ok: true;
      game: GameState;
    }
  | {
      ok: false;
      code:
        | "JSON_PARSE_FAILED"
        | "SCHEMA_VALIDATION_FAILED"
        | "GAME_INVARIANT_FAILED";
      issues?: string[];
    };

interface ValidationRegistries {
  roomIds: Set<string>;
  puzzleIds: Set<string>;
  clueIds: Set<string>;
  collectibleItemIds: Set<string>;
  objectiveIds: Set<string>;
  narrativeIds: Set<string>;
}

export function validateGeneratedGameResponse(
  rawText: string,
  input: GameGenerationPromptInput,
): GameResponseValidationResult {
  const parsedJson = parseJson(stripMarkdownCodeFences(rawText));

  if (!parsedJson.ok) {
    return {
      ok: false,
      code: "JSON_PARSE_FAILED",
    };
  }

  const parsedGame = gameStateSchema.safeParse(parsedJson.value);

  if (!parsedGame.success) {
    return {
      ok: false,
      code: "SCHEMA_VALIDATION_FAILED",
      issues: parsedGame.error.issues.map(
        (issue) => issue.path.join(".") || issue.message,
      ),
    };
  }

  const invariantIssues = validateGeneratedGame(parsedGame.data, input);

  if (invariantIssues.length > 0) {
    return {
      ok: false,
      code: "GAME_INVARIANT_FAILED",
      issues: invariantIssues,
    };
  }

  return {
    ok: true,
    game: parsedGame.data,
  };
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

  const roomIds = new Set(game.rooms.map((room) => room.id));
  const puzzleIds = new Set(game.rooms.map((room) => room.puzzle.id));
  const collectibleItemIds = new Set(
    game.rooms.flatMap((room) =>
      room.objects.flatMap((object) =>
        object.collectibleItemId ? [object.collectibleItemId] : [],
      ),
    ),
  );
  const registries: ValidationRegistries = {
    roomIds: new Set(),
    puzzleIds: new Set(),
    clueIds: new Set(),
    collectibleItemIds: new Set(),
    objectiveIds: new Set(),
    narrativeIds: new Set(),
  };

  validateIdFormat(issues, game.id, "game");

  game.rooms.forEach((room, index) => {
    validateRoom(
      room,
      index,
      registries,
      roomIds,
      puzzleIds,
      collectibleItemIds,
      issues,
    );
  });

  game.objectives.forEach((objective) => {
    registerUniqueId(registries.objectiveIds, issues, objective.id, "objective");
    if (objective.completed) {
      issues.push(`Objective ${objective.id} must start incomplete.`);
    }
  });

  game.narrativeHistory.forEach((entry) => {
    registerUniqueId(
      registries.narrativeIds,
      issues,
      entry.id,
      "narrative entry",
    );
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
  registries: ValidationRegistries,
  roomIds: Set<string>,
  puzzleIds: Set<string>,
  collectibleItemIds: Set<string>,
  issues: string[],
) {
  const roomObjectIds = new Set<string>();
  const roomExitIds = new Set<string>();

  registerUniqueId(registries.roomIds, issues, room.id, `room ${index + 1}`);
  registerUniqueId(
    registries.puzzleIds,
    issues,
    room.puzzle.id,
    `puzzle in ${room.id}`,
  );

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

  if (room.clues.length < 2) {
    issues.push(`Room ${room.id} must define at least two clues.`);
  }

  room.clues.forEach((clue) => {
    registerUniqueId(registries.clueIds, issues, clue.id, `clue in ${room.id}`);
  });

  room.puzzle.clueIds.forEach((clueId) => {
    if (!clueIds.has(clueId)) {
      issues.push(`Puzzle ${room.puzzle.id} references missing clue ${clueId}.`);
    }
  });

  room.objects.forEach((object) => {
    registerUniqueId(roomObjectIds, issues, object.id, `object in ${room.id}`);

    if (object.collectibleItemId) {
      registerUniqueId(
        registries.collectibleItemIds,
        issues,
        object.collectibleItemId,
        `item in ${room.id}`,
      );
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
    registerUniqueId(roomExitIds, issues, exit.id, `exit in ${room.id}`);

    if (!exit.final && (!exit.toRoomId || !roomIds.has(exit.toRoomId))) {
      issues.push(`Exit ${exit.id} must point to an existing room.`);
    }

    if (exit.requiredPuzzleId && !puzzleIds.has(exit.requiredPuzzleId)) {
      issues.push(`Exit ${exit.id} requires unknown puzzle ${exit.requiredPuzzleId}.`);
    }
  });
}

function registerUniqueId(
  registry: Set<string>,
  issues: string[],
  id: string,
  label: string,
) {
  validateIdFormat(issues, id, label);

  if (registry.has(id)) {
    issues.push(`Duplicate id found: ${id}.`);
    return;
  }

  registry.add(id);
}

function validateIdFormat(issues: string[], id: string, label: string) {
  if (!isUrlSafeId(id)) {
    issues.push(`${label} id is not URL-safe: ${id}.`);
  }
}

function isUrlSafeId(id: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
}
