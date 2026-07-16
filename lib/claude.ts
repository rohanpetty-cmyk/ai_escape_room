import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlock } from "@anthropic-ai/sdk/resources/messages";
import { gameStateSchema } from "./schemas";
import {
  buildGameGenerationPrompt,
  GAME_ARCHITECT_SYSTEM_PROMPT,
  type GameGenerationPromptInput,
} from "./prompts";
import type { GameState, Room } from "./types";

const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
const GENERATION_TIMEOUT_MS = 20_000;

export type ClaudeGenerationErrorCode =
  | "MISSING_API_KEY"
  | "CLAUDE_REQUEST_FAILED"
  | "EMPTY_RESPONSE"
  | "JSON_PARSE_FAILED"
  | "SCHEMA_VALIDATION_FAILED"
  | "GAME_INVARIANT_FAILED";

export interface ClaudeStatus {
  configured: boolean;
  model: string;
  message: string;
}

export interface ClaudeGenerationSuccess {
  ok: true;
  game: GameState;
  model: string;
}

export interface ClaudeGenerationFailure {
  ok: false;
  code: ClaudeGenerationErrorCode;
  message: string;
  model: string;
  issues?: string[];
}

export type ClaudeGenerationResult =
  | ClaudeGenerationSuccess
  | ClaudeGenerationFailure;

export function getClaudeStatus(): ClaudeStatus {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY);
  const model = getClaudeModel();

  return {
    configured,
    model,
    message: configured
      ? "Claude generation is configured."
      : "ANTHROPIC_API_KEY is not configured. Static fallback mode is active.",
  };
}

export async function generateGameWithClaude(
  input: GameGenerationPromptInput,
): Promise<ClaudeGenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = getClaudeModel();

  if (!apiKey) {
    return failure(
      "MISSING_API_KEY",
      "ANTHROPIC_API_KEY is not configured. Using the static fallback game.",
      model,
    );
  }

  const client = new Anthropic({
    apiKey,
    maxRetries: 0,
    timeout: GENERATION_TIMEOUT_MS,
  });

  let rawText: string;

  try {
    const message = await client.messages.create(
      {
        model,
        max_tokens: input.demoMode ? 2_500 : 5_500,
        temperature: temperatureForDifficulty(input.difficulty),
        system: GAME_ARCHITECT_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: buildGameGenerationPrompt(input),
          },
        ],
      },
      {
        timeout: GENERATION_TIMEOUT_MS,
      },
    );

    rawText = extractTextContent(message.content);
  } catch {
    return failure(
      "CLAUDE_REQUEST_FAILED",
      "Claude did not return a game in time. Using the static fallback game.",
      model,
    );
  }

  if (!rawText.trim()) {
    return failure(
      "EMPTY_RESPONSE",
      "Claude returned an empty response. Using the static fallback game.",
      model,
    );
  }

  const jsonText = stripMarkdownCodeFences(rawText);
  const parsedJson = parseJson(jsonText);

  if (!parsedJson.ok) {
    return failure(
      "JSON_PARSE_FAILED",
      "Claude returned text that could not be parsed as JSON. Using the static fallback game.",
      model,
    );
  }

  const parsedGame = gameStateSchema.safeParse(parsedJson.value);

  if (!parsedGame.success) {
    return failure(
      "SCHEMA_VALIDATION_FAILED",
      "Claude returned JSON that did not match the GameState schema. Using the static fallback game.",
      model,
      parsedGame.error.issues.map((issue) => issue.path.join(".") || issue.message),
    );
  }

  const invariantIssues = validateGeneratedGame(parsedGame.data, input);

  if (invariantIssues.length > 0) {
    return failure(
      "GAME_INVARIANT_FAILED",
      "Claude returned a game that failed gameplay validation. Using the static fallback game.",
      model,
      invariantIssues,
    );
  }

  return {
    ok: true,
    game: parsedGame.data,
    model,
  };
}

export function stripMarkdownCodeFences(value: string): string {
  const trimmed = value.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return (fenceMatch?.[1] ?? trimmed).trim();
}

function getClaudeModel() {
  return process.env.CLAUDE_MODEL?.trim() || DEFAULT_CLAUDE_MODEL;
}

function temperatureForDifficulty(difficulty: GameGenerationPromptInput["difficulty"]) {
  if (difficulty === "easy") return 0.2;
  if (difficulty === "hard") return 0.5;

  return 0.35;
}

function extractTextContent(content: ContentBlock[]) {
  return content
    .filter((block): block is Extract<ContentBlock, { type: "text" }> => {
      return block.type === "text";
    })
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseJson(value: string):
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

function validateGeneratedGame(
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

function failure(
  code: ClaudeGenerationErrorCode,
  message: string,
  model: string,
  issues?: string[],
): ClaudeGenerationFailure {
  return {
    ok: false,
    code,
    message,
    model,
    issues,
  };
}
