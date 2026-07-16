import assert from "node:assert/strict";
import test from "node:test";
import { generateGameWithOpenAI } from "../lib/openai";

test("generateGameWithOpenAI fails gracefully without an API key", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const result = await generateGameWithOpenAI({
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
      process.env.OPENAI_API_KEY = previousKey;
    }
  }
});
