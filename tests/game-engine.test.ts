import assert from "node:assert/strict";
import test from "node:test";
import {
  addInventoryItem,
  addNarrativeEntry,
  applyEffects,
  canMoveToRoom,
  checkVictoryCondition,
  completeObjective,
  createInitialGame,
  discoverClue,
  getCurrentRoom,
  getVisibleObjects,
  isPuzzleAnswerCorrect,
  moveToRoom,
  normalizeAnswer,
  solvePuzzle,
  validateEffect,
} from "../lib/game-engine";
import { demoGame, sampleGame } from "../lib/sample-game";
import type { GameEffect, InventoryItem, NarrativeEntry } from "../lib/types";

function freshSample() {
  return createInitialGame(sampleGame);
}

test("addInventoryItem returns new state and never duplicates items", () => {
  const game = freshSample();
  const item: InventoryItem = {
    id: "admin-badge",
    name: "admin badge",
    description: "A supervisor admin badge.",
    icon: "badge",
  };

  const once = addInventoryItem(game, item);
  const twice = addInventoryItem(once, item);

  assert.notEqual(once, game);
  assert.equal(game.inventory.length, 0);
  assert.equal(once.inventory.length, 1);
  assert.equal(twice.inventory.length, 1);
});

test("discoverClue never duplicates clue ids", () => {
  const game = freshSample();
  const once = discoverClue(game, "control-mode-clue");
  const twice = discoverClue(once, "control-mode-clue");

  assert.deepEqual(game.discoveredClueIds, []);
  assert.deepEqual(once.discoveredClueIds, ["control-mode-clue"]);
  assert.deepEqual(twice.discoveredClueIds, ["control-mode-clue"]);
});

test("solvePuzzle marks a puzzle once and prevents duplicate solved ids", () => {
  const game = freshSample();
  const once = solvePuzzle(game, "control-override", "control-room");
  const twice = solvePuzzle(once, "control-override", "control-room");
  const solvedRoom = getCurrentRoom(once);

  assert.equal(game.solvedPuzzleIds.length, 0);
  assert.deepEqual(once.solvedPuzzleIds, ["control-override"]);
  assert.deepEqual(twice.solvedPuzzleIds, ["control-override"]);
  assert.equal(solvedRoom.puzzle.solved, true);
});

test("normalizeAnswer and isPuzzleAnswerCorrect trim and ignore case", () => {
  const puzzle = getCurrentRoom(freshSample()).puzzle;

  assert.equal(normalizeAnswer("  A17  "), "a17");
  assert.equal(isPuzzleAnswerCorrect(puzzle, "  a17  "), true);
  assert.equal(isPuzzleAnswerCorrect(puzzle, "MANUAL A17"), true);
  assert.equal(isPuzzleAnswerCorrect(puzzle, "A18"), false);
});

test("canMoveToRoom prevents movement through locked exits", () => {
  const game = freshSample();
  const lockedMove: GameEffect = {
    type: "MOVE_ROOM",
    roomId: "server-chamber",
  };
  const rejected = applyEffects(game, [lockedMove]);
  const solved = applyEffects(game, [
    {
      type: "SOLVE_PUZZLE",
      puzzleId: "control-override",
      roomId: "control-room",
    },
  ]);
  const moved = applyEffects(solved, [lockedMove]);

  assert.equal(canMoveToRoom(game, "server-chamber"), false);
  assert.equal(rejected.currentRoomId, "control-room");
  assert.equal(canMoveToRoom(solved, "server-chamber"), true);
  assert.equal(moved.currentRoomId, "server-chamber");
});

test("validateEffect rejects nonexistent ids", () => {
  const game = freshSample();

  assert.equal(
    validateEffect(game, { type: "DISCOVER_CLUE", clueId: "missing-clue" })
      .valid,
    false,
  );
  assert.equal(
    validateEffect(game, {
      type: "SOLVE_PUZZLE",
      puzzleId: "missing-puzzle",
      roomId: "control-room",
    }).valid,
    false,
  );
  assert.equal(
    validateEffect(game, { type: "MOVE_ROOM", roomId: "missing-room" }).valid,
    false,
  );
});

test("applyEffects skips rejected effects and applies valid ones immutably", () => {
  const game = freshSample();
  const applied = applyEffects(game, [
    { type: "DISCOVER_CLUE", clueId: "missing-clue" },
    { type: "DISCOVER_CLUE", clueId: "control-mode-clue" },
    { type: "DISCOVER_CLUE", clueId: "control-mode-clue" },
  ]);

  assert.deepEqual(game.discoveredClueIds, []);
  assert.deepEqual(applied.discoveredClueIds, ["control-mode-clue"]);
});

test("moveToRoom and completeObjective return new game state", () => {
  const game = freshSample();
  const moved = moveToRoom(game, "server-chamber");
  const completed = completeObjective(game, "objective-control-room");

  assert.equal(game.currentRoomId, "control-room");
  assert.equal(moved.currentRoomId, "server-chamber");
  assert.equal(game.objectives[0]?.completed, false);
  assert.equal(completed.objectives[0]?.completed, true);
});

test("addNarrativeEntry appends history without mutating original state", () => {
  const game = freshSample();
  const entry: NarrativeEntry = {
    id: "test-entry",
    role: "system",
    content: "A test narration.",
    timestamp: 1,
  };
  const next = addNarrativeEntry(game, entry);

  assert.equal(game.narrativeHistory.length, 1);
  assert.equal(next.narrativeHistory.length, 2);
  assert.equal(next.narrativeHistory.at(-1)?.content, "A test narration.");
});

test("getVisibleObjects returns only visible objects in the current room", () => {
  const game = freshSample();
  const visibleObjects = getVisibleObjects(game);

  assert.equal(visibleObjects.every((object) => object.visible), true);
  assert.equal(
    visibleObjects.some((object) => object.id === "status-wall"),
    true,
  );
});

test("checkVictoryCondition gates ESCAPE until the final exit is unlocked", () => {
  const game = createInitialGame(demoGame);
  const solved = applyEffects(game, [
    {
      type: "SOLVE_PUZZLE",
      puzzleId: "demo-release",
      roomId: "training-bay",
    },
  ]);
  const escaped = applyEffects(solved, [{ type: "ESCAPE" }]);

  assert.equal(checkVictoryCondition(game), false);
  assert.equal(checkVictoryCondition(solved), true);
  assert.equal(escaped.status, "escaped");
});
