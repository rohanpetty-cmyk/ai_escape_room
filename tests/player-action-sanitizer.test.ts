import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeActionResult } from "../app/api/player-action/route";
import {
  createInitialGame,
  getCurrentRoom,
  getVisibleObjects,
} from "../lib/game-engine";
import type { DungeonMasterPromptInput } from "../lib/prompts";
import { sampleGame } from "../lib/sample-game";
import type { PlayerActionResult } from "../lib/types";

function sanitizerContext(action: string): {
  context: DungeonMasterPromptInput;
  game: ReturnType<typeof createInitialGame>;
} {
  const game = createInitialGame(sampleGame);
  const room = getCurrentRoom(game);

  return {
    game,
    context: {
      action,
      answerAttempt: false,
      currentRoom: {
        id: room.id,
        name: room.name,
        description: room.description,
        puzzle: {
          id: room.puzzle.id,
          type: room.puzzle.type,
          prompt: room.puzzle.prompt,
          solved: false,
        },
      },
      visibleObjects: getVisibleObjects(room).map((object) => ({
        id: object.id,
        name: object.name,
        description: object.description,
        searchable: object.searchable,
        requiredItemId: object.requiredItemId,
        collectibleItem: object.collectibleItemId
          ? {
              id: object.collectibleItemId,
              name: object.name,
              description: object.description,
              icon: "box",
            }
          : null,
        discoverableClues: room.clues.filter((clue) =>
          object.discoveredClueIds.includes(clue.id),
        ),
      })),
      currentInventory: [],
      discoveredClues: [],
      solvedPuzzleIds: [],
      availableExits: room.exits.map((exit) => ({
        id: exit.id,
        label: exit.label,
        direction: exit.direction,
        toRoomId: exit.toRoomId,
        requiredPuzzleId: exit.requiredPuzzleId,
        final: exit.final,
        unlocked: !exit.requiredPuzzleId,
      })),
    },
  };
}

test("sanitizeActionResult drops unsafe effects without rejecting the narration", () => {
  const { game, context } = sanitizerContext("inspect the impossible console");
  const modelResult: PlayerActionResult = {
    intent: "INSPECT",
    targetId: "hallucinated-console",
    valid: true,
    narration: "The impossible console flickers, but the room refuses to confirm it.",
    effects: [
      {
        type: "DISCOVER_CLUE",
        clueId: "hallucinated-clue",
      },
    ],
  };

  const sanitized = sanitizeActionResult(
    game,
    context.action,
    context,
    modelResult,
  );

  assert.equal(sanitized.result.targetId, null);
  assert.equal(sanitized.result.narration, modelResult.narration);
  assert.equal(
    sanitized.result.effects.some((effect) => effect.type === "DISCOVER_CLUE"),
    false,
  );
  assert.ok(sanitized.issues.length >= 2);
});

test("sanitizeActionResult keeps valid effects while dropping unsafe extras", () => {
  const { game, context } = sanitizerContext("inspect status wall");
  const modelResult: PlayerActionResult = {
    intent: "INSPECT",
    targetId: "status-wall",
    valid: true,
    narration: "The status wall confirms the manual override layer.",
    effects: [
      {
        type: "DISCOVER_CLUE",
        clueId: "control-mode-clue",
      },
      {
        type: "DISCOVER_CLUE",
        clueId: "hallucinated-clue",
      },
    ],
  };

  const sanitized = sanitizeActionResult(
    game,
    context.action,
    context,
    modelResult,
  );

  assert.equal(sanitized.result.targetId, "status-wall");
  assert.equal(
    sanitized.result.effects.some(
      (effect) =>
        effect.type === "DISCOVER_CLUE" &&
        effect.clueId === "control-mode-clue",
    ),
    true,
  );
  assert.equal(
    sanitized.result.effects.some(
      (effect) =>
        effect.type === "DISCOVER_CLUE" &&
        effect.clueId === "hallucinated-clue",
    ),
    false,
  );
  assert.ok(sanitized.issues.length >= 1);
});
