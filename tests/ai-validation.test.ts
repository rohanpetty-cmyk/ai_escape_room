import assert from "node:assert/strict";
import test from "node:test";
import { validateGeneratedGame } from "../lib/ai-validation";
import type { GameGenerationPromptInput } from "../lib/prompts";
import { sampleGame } from "../lib/sample-game";

const normalGenerationInput: GameGenerationPromptInput = {
  theme: sampleGame.theme,
  difficulty: "medium",
  demoMode: false,
};

test("validateGeneratedGame allows duplicate object ids in different rooms", () => {
  const game = structuredClone(sampleGame);
  const reusedObjectId = game.rooms[0]?.objects[0]?.id;

  assert.ok(reusedObjectId);
  game.rooms[1]!.objects[0]!.id = reusedObjectId;

  const issues = validateGeneratedGame(game, normalGenerationInput);

  assert.deepEqual(
    issues.filter((issue) => issue.includes("Duplicate id found")),
    [],
  );
});

test("validateGeneratedGame rejects duplicate object ids in the same room", () => {
  const game = structuredClone(sampleGame);
  const reusedObjectId = game.rooms[0]?.objects[0]?.id;

  assert.ok(reusedObjectId);
  game.rooms[0]!.objects[1]!.id = reusedObjectId;

  const issues = validateGeneratedGame(game, normalGenerationInput);

  assert.ok(
    issues.some((issue) => issue === `Duplicate id found: ${reusedObjectId}.`),
  );
});
