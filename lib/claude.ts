import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlock } from "@anthropic-ai/sdk/resources/messages";
import {
  AI_ACTION_TIMEOUT_MS,
  AI_GENERATION_TIMEOUT_MS,
  parseJson,
  stripMarkdownCodeFences,
  temperatureForDifficulty,
  validateGeneratedGameResponse,
} from "./ai-validation";
import { playerActionResultSchema } from "./schemas";
import {
  buildGameRepairPrompt,
  buildGameGenerationPrompt,
  buildDungeonMasterPrompt,
  DUNGEON_MASTER_SYSTEM_PROMPT,
  GAME_ARCHITECT_SYSTEM_PROMPT,
  type DungeonMasterPromptInput,
  type GameGenerationPromptInput,
} from "./prompts";
import type { GameState, PlayerActionResult } from "./types";

const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

export { stripMarkdownCodeFences };

export type ClaudeGenerationErrorCode =
  | "MISSING_API_KEY"
  | "CLAUDE_REQUEST_FAILED"
  | "EMPTY_RESPONSE"
  | "JSON_PARSE_FAILED"
  | "SCHEMA_VALIDATION_FAILED"
  | "GAME_INVARIANT_FAILED";

export type ClaudeActionErrorCode =
  | "MISSING_API_KEY"
  | "CLAUDE_REQUEST_FAILED"
  | "EMPTY_RESPONSE"
  | "JSON_PARSE_FAILED"
  | "SCHEMA_VALIDATION_FAILED";

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

export interface ClaudeActionSuccess {
  ok: true;
  result: PlayerActionResult;
  model: string;
}

export interface ClaudeActionFailure {
  ok: false;
  code: ClaudeActionErrorCode;
  message: string;
  model: string;
  issues?: string[];
}

export type ClaudeActionResult = ClaudeActionSuccess | ClaudeActionFailure;

export function getClaudeStatus(): ClaudeStatus {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY);
  const model = getClaudeModel();

  return {
    configured,
    model,
    message: configured
      ? "Claude API access is configured."
      : "ANTHROPIC_API_KEY is not configured. Static fallback mode is active.",
  };
}

export async function generateGameWithClaude(
  input: GameGenerationPromptInput,
): Promise<ClaudeGenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = getClaudeModel();

  if (!apiKey) {
    return generationFailure(
      "MISSING_API_KEY",
      "ANTHROPIC_API_KEY is not configured. Using the static fallback game.",
      model,
    );
  }

  const client = new Anthropic({
    apiKey,
    maxRetries: 0,
    timeout: AI_GENERATION_TIMEOUT_MS,
  });

  let rawText: string;

  try {
    rawText = await requestGameTextFromClaude(
      client,
      model,
      buildGameGenerationPrompt(input),
      input,
    );
  } catch {
    return generationFailure(
      "CLAUDE_REQUEST_FAILED",
      "Claude did not return a game in time. Using the static fallback game.",
      model,
    );
  }

  const firstValidation = validateClaudeGameResponse(rawText, input, model);
  if (firstValidation.ok) {
    return firstValidation;
  }

  let repairedText: string;

  try {
    repairedText = await requestGameTextFromClaude(
      client,
      model,
      buildGameRepairPrompt({
        ...input,
        invalidJson: rawText,
        issues: firstValidation.issues ?? [firstValidation.message],
      }),
      input,
    );
  } catch {
    return firstValidation;
  }

  const repairedValidation = validateClaudeGameResponse(repairedText, input, model);

  return repairedValidation;
}

export async function processPlayerActionWithClaude(
  input: DungeonMasterPromptInput,
): Promise<ClaudeActionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = getClaudeModel();

  if (!apiKey) {
    return actionFailure(
      "MISSING_API_KEY",
      "ANTHROPIC_API_KEY is not configured. Using deterministic local action handling.",
      model,
    );
  }

  const client = new Anthropic({
    apiKey,
    maxRetries: 0,
    timeout: AI_ACTION_TIMEOUT_MS,
  });

  let rawText: string;

  try {
    const message = await client.messages.create(
      {
        model,
        max_tokens: 1_200,
        temperature: 0.25,
        system: DUNGEON_MASTER_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: buildDungeonMasterPrompt(input),
          },
        ],
      },
      {
        timeout: AI_ACTION_TIMEOUT_MS,
      },
    );

    rawText = extractTextContent(message.content);
  } catch {
    return actionFailure(
      "CLAUDE_REQUEST_FAILED",
      "Claude could not process that action in time. The current game state was preserved.",
      model,
    );
  }

  if (!rawText.trim()) {
    return actionFailure(
      "EMPTY_RESPONSE",
      "Claude returned an empty action response. The current game state was preserved.",
      model,
    );
  }

  const jsonText = stripMarkdownCodeFences(rawText);
  const parsedJson = parseJson(jsonText);

  if (!parsedJson.ok) {
    return actionFailure(
      "JSON_PARSE_FAILED",
      "Claude returned action text that could not be parsed as JSON. The current game state was preserved.",
      model,
    );
  }

  const parsedAction = playerActionResultSchema.safeParse(parsedJson.value);

  if (!parsedAction.success) {
    return actionFailure(
      "SCHEMA_VALIDATION_FAILED",
      "Claude returned an action response that did not match the PlayerActionResult schema. The current game state was preserved.",
      model,
      parsedAction.error.issues.map((issue) => issue.path.join(".") || issue.message),
    );
  }

  return {
    ok: true,
    result: parsedAction.data,
    model,
  };
}

function validateClaudeGameResponse(
  rawText: string,
  input: GameGenerationPromptInput,
  model: string,
): ClaudeGenerationResult {
  if (!rawText.trim()) {
    return generationFailure(
      "EMPTY_RESPONSE",
      "Claude returned an empty response. Using the static fallback game.",
      model,
    );
  }

  const validation = validateGeneratedGameResponse(rawText, input);

  if (validation.ok) {
    return {
      ok: true,
      game: validation.game,
      model,
    };
  }

  if (validation.code === "JSON_PARSE_FAILED") {
    return generationFailure(
      "JSON_PARSE_FAILED",
      "Claude returned text that could not be parsed as JSON. Using the static fallback game.",
      model,
    );
  }

  if (validation.code === "SCHEMA_VALIDATION_FAILED") {
    return generationFailure(
      "SCHEMA_VALIDATION_FAILED",
      "Claude returned JSON that did not match the GameState schema. Using the static fallback game.",
      model,
      validation.issues,
    );
  }

  return generationFailure(
    "GAME_INVARIANT_FAILED",
    "Claude returned a game that failed gameplay validation. Using the static fallback game.",
    model,
    validation.issues,
  );
}

async function requestGameTextFromClaude(
  client: Anthropic,
  model: string,
  prompt: string,
  input: GameGenerationPromptInput,
): Promise<string> {
  const message = await client.messages.create(
    {
      model,
      max_tokens: input.demoMode ? 2_500 : 5_500,
      temperature: temperatureForDifficulty(input.difficulty),
      system: GAME_ARCHITECT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    },
    {
      timeout: AI_GENERATION_TIMEOUT_MS,
    },
  );

  return extractTextContent(message.content);
}

function getClaudeModel() {
  return process.env.CLAUDE_MODEL?.trim() || DEFAULT_CLAUDE_MODEL;
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

function generationFailure(
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

function actionFailure(
  code: ClaudeActionErrorCode,
  message: string,
  model: string,
  issues?: string[],
): ClaudeActionFailure {
  return {
    ok: false,
    code,
    message,
    model,
    issues,
  };
}
