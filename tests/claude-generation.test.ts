import assert from "node:assert/strict";
import test from "node:test";
import { generateGameWithClaude, stripMarkdownCodeFences } from "../lib/claude";

test("stripMarkdownCodeFences removes json fences", () => {
  const result = stripMarkdownCodeFences('```json\n{"ok":true}\n```');

  assert.equal(result, '{"ok":true}');
});

test("generateGameWithClaude fails gracefully without an API key", async () => {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  try {
    const result = await generateGameWithClaude({
      theme: "Locked orbital AI greenhouse",
      difficulty: "easy",
      demoMode: true,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "MISSING_API_KEY");
      assert.doesNotMatch(result.message, /Error:|at\s+\w+/);
    }
  } finally {
    if (previousKey) {
      process.env.ANTHROPIC_API_KEY = previousKey;
    }
  }
});
