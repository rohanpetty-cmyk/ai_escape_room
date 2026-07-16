import OpenAI from "openai";
import {
  AI_ACTION_TIMEOUT_MS,
  AI_GENERATION_TIMEOUT_MS,
  parseJson,
  stripMarkdownCodeFences,
  temperatureForDifficulty,
  validateGeneratedGameResponse,
} from "./ai-validation";
import {
  buildDungeonMasterPrompt,
  buildGameRepairPrompt,
  buildGameGenerationPrompt,
  DUNGEON_MASTER_SYSTEM_PROMPT,
  GAME_ARCHITECT_SYSTEM_PROMPT,
  type DungeonMasterPromptInput,
  type GameGenerationPromptInput,
} from "./prompts";
import { playerActionResultSchema } from "./schemas";
import type { GameState, PlayerActionResult } from "./types";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

export type OpenAIGenerationErrorCode =
  | "MISSING_API_KEY"
  | "OPENAI_REQUEST_FAILED"
  | "EMPTY_RESPONSE"
  | "JSON_PARSE_FAILED"
  | "SCHEMA_VALIDATION_FAILED"
  | "GAME_INVARIANT_FAILED";

export type OpenAIActionErrorCode =
  | "MISSING_API_KEY"
  | "OPENAI_REQUEST_FAILED"
  | "EMPTY_RESPONSE"
  | "JSON_PARSE_FAILED"
  | "SCHEMA_VALIDATION_FAILED";

export interface OpenAIStatus {
  configured: boolean;
  model: string;
  message: string;
}

export interface OpenAIGenerationSuccess {
  ok: true;
  game: GameState;
  model: string;
}

export interface OpenAIGenerationFailure {
  ok: false;
  code: OpenAIGenerationErrorCode;
  message: string;
  model: string;
  issues?: string[];
}

export type OpenAIGenerationResult =
  | OpenAIGenerationSuccess
  | OpenAIGenerationFailure;

export interface OpenAIActionSuccess {
  ok: true;
  result: PlayerActionResult;
  model: string;
}

export interface OpenAIActionFailure {
  ok: false;
  code: OpenAIActionErrorCode;
  message: string;
  model: string;
  issues?: string[];
}

export type OpenAIActionResult = OpenAIActionSuccess | OpenAIActionFailure;

export function getOpenAIStatus(): OpenAIStatus {
  const configured = Boolean(process.env.OPENAI_API_KEY);
  const model = getOpenAIModel();

  return {
    configured,
    model,
    message: configured
      ? "OpenAI API access is configured."
      : "OPENAI_API_KEY is not configured. Static fallback mode is active.",
  };
}

export async function generateGameWithOpenAI(
  input: GameGenerationPromptInput,
): Promise<OpenAIGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = getOpenAIModel();

  if (!apiKey) {
    return generationFailure(
      "MISSING_API_KEY",
      "OPENAI_API_KEY is not configured. Using the static fallback game.",
      model,
    );
  }

  const client = new OpenAI({
    apiKey,
    maxRetries: 0,
    timeout: AI_GENERATION_TIMEOUT_MS,
  });

  let rawText: string;

  try {
    rawText = await requestGameTextFromOpenAI(
      client,
      model,
      buildGameGenerationPrompt(input),
      input,
    );
  } catch {
    return generationFailure(
      "OPENAI_REQUEST_FAILED",
      "OpenAI did not return a game in time. Using the static fallback game.",
      model,
    );
  }

  const firstValidation = validateOpenAIGameResponse(rawText, input, model);
  if (firstValidation.ok) {
    return firstValidation;
  }

  let repairedText: string;

  try {
    repairedText = await requestGameTextFromOpenAI(
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

  const repairedValidation = validateOpenAIGameResponse(repairedText, input, model);

  return repairedValidation;
}

export async function processPlayerActionWithOpenAI(
  input: DungeonMasterPromptInput,
): Promise<OpenAIActionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = getOpenAIModel();

  if (!apiKey) {
    return actionFailure(
      "MISSING_API_KEY",
      "OPENAI_API_KEY is not configured. Using deterministic local action handling.",
      model,
    );
  }

  const client = new OpenAI({
    apiKey,
    maxRetries: 0,
    timeout: AI_ACTION_TIMEOUT_MS,
  });

  let rawText: string;

  try {
    const response = await client.responses.create(
      {
        model,
        instructions: DUNGEON_MASTER_SYSTEM_PROMPT,
        input: buildDungeonMasterPrompt(input),
        max_output_tokens: 1_200,
        store: false,
        temperature: 0.25,
        text: {
          format: {
            type: "json_object",
          },
        },
      },
      {
        timeout: AI_ACTION_TIMEOUT_MS,
      },
    );

    rawText = response.output_text.trim();
  } catch {
    return actionFailure(
      "OPENAI_REQUEST_FAILED",
      "OpenAI could not process that action in time. The current game state was preserved.",
      model,
    );
  }

  if (!rawText.trim()) {
    return actionFailure(
      "EMPTY_RESPONSE",
      "OpenAI returned an empty action response. The current game state was preserved.",
      model,
    );
  }

  const parsedJson = parseJson(stripMarkdownCodeFences(rawText));

  if (!parsedJson.ok) {
    return actionFailure(
      "JSON_PARSE_FAILED",
      "OpenAI returned action text that could not be parsed as JSON. The current game state was preserved.",
      model,
    );
  }

  const parsedAction = playerActionResultSchema.safeParse(parsedJson.value);

  if (!parsedAction.success) {
    return actionFailure(
      "SCHEMA_VALIDATION_FAILED",
      "OpenAI returned an action response that did not match the PlayerActionResult schema. The current game state was preserved.",
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

function validateOpenAIGameResponse(
  rawText: string,
  input: GameGenerationPromptInput,
  model: string,
): OpenAIGenerationResult {
  if (!rawText.trim()) {
    return generationFailure(
      "EMPTY_RESPONSE",
      "OpenAI returned an empty response. Using the static fallback game.",
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
      "OpenAI returned text that could not be parsed as JSON. Using the static fallback game.",
      model,
    );
  }

  if (validation.code === "SCHEMA_VALIDATION_FAILED") {
    return generationFailure(
      "SCHEMA_VALIDATION_FAILED",
      "OpenAI returned JSON that did not match the GameState schema. Using the static fallback game.",
      model,
      validation.issues,
    );
  }

  return generationFailure(
    "GAME_INVARIANT_FAILED",
    "OpenAI returned a game that failed gameplay validation. Using the static fallback game.",
    model,
    validation.issues,
  );
}

async function requestGameTextFromOpenAI(
  client: OpenAI,
  model: string,
  prompt: string,
  input: GameGenerationPromptInput,
): Promise<string> {
  const response = await client.responses.create(
    {
      model,
      instructions: GAME_ARCHITECT_SYSTEM_PROMPT,
      input: prompt,
      max_output_tokens: input.demoMode ? 2_500 : 5_500,
      store: false,
      temperature: temperatureForDifficulty(input.difficulty),
      text: {
        format: {
          type: "json_object",
        },
      },
    },
    {
      timeout: AI_GENERATION_TIMEOUT_MS,
    },
  );

  return response.output_text.trim();
}

function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

function generationFailure(
  code: OpenAIGenerationErrorCode,
  message: string,
  model: string,
  issues?: string[],
): OpenAIGenerationFailure {
  return {
    ok: false,
    code,
    message,
    model,
    issues,
  };
}

function actionFailure(
  code: OpenAIActionErrorCode,
  message: string,
  model: string,
  issues?: string[],
): OpenAIActionFailure {
  return {
    ok: false,
    code,
    message,
    model,
    issues,
  };
}
