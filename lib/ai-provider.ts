import {
  generateGameWithClaude,
  getClaudeStatus,
  processPlayerActionWithClaude,
  type ClaudeActionFailure,
  type ClaudeGenerationFailure,
} from "./claude";
import {
  generateGameWithOpenAI,
  getOpenAIStatus,
  processPlayerActionWithOpenAI,
  type OpenAIActionFailure,
  type OpenAIGenerationFailure,
} from "./openai";
import type {
  DungeonMasterPromptInput,
  GameGenerationPromptInput,
} from "./prompts";
import type { AIProvider, GameState, PlayerActionResult } from "./types";

export type ProviderGenerationFailure =
  | (ClaudeGenerationFailure & { provider: "claude" })
  | (OpenAIGenerationFailure & { provider: "openai" });

export type ProviderGenerationResult =
  | {
      ok: true;
      provider: AIProvider;
      game: GameState;
      model: string;
    }
  | ProviderGenerationFailure;

export type ProviderActionFailure =
  | (ClaudeActionFailure & { provider: "claude" })
  | (OpenAIActionFailure & { provider: "openai" });

export type ProviderActionResult =
  | {
      ok: true;
      provider: AIProvider;
      result: PlayerActionResult;
      model: string;
    }
  | ProviderActionFailure;

export interface ProviderStatus {
  provider: AIProvider;
  configured: boolean;
  model: string;
  message: string;
}

const DEFAULT_AI_PROVIDER: AIProvider = "claude";

export function getDefaultAIProvider(): AIProvider {
  return isAIProvider(process.env.AI_PROVIDER)
    ? process.env.AI_PROVIDER
    : DEFAULT_AI_PROVIDER;
}

export function resolveAIProvider(provider?: AIProvider | null): AIProvider {
  return provider ?? getDefaultAIProvider();
}

export function resolveConfiguredAIProvider(
  provider?: AIProvider | null,
): AIProvider {
  const preferredProvider = resolveAIProvider(provider);

  if (getProviderStatus(preferredProvider).configured) {
    return preferredProvider;
  }

  const alternateProvider =
    preferredProvider === "openai" ? "claude" : "openai";

  return getProviderStatus(alternateProvider).configured
    ? alternateProvider
    : preferredProvider;
}

export function getProviderStatus(provider: AIProvider): ProviderStatus {
  const status =
    provider === "openai" ? getOpenAIStatus() : getClaudeStatus();

  return {
    provider,
    ...status,
  };
}

export function getProviderStatuses(): ProviderStatus[] {
  return [getProviderStatus("claude"), getProviderStatus("openai")];
}

export async function generateGameWithProvider(
  provider: AIProvider,
  input: GameGenerationPromptInput,
): Promise<ProviderGenerationResult> {
  if (provider === "openai") {
    const result = await generateGameWithOpenAI(input);
    return {
      ...result,
      provider,
    };
  }

  const result = await generateGameWithClaude(input);
  return {
    ...result,
    provider,
  };
}

export async function processPlayerActionWithProvider(
  provider: AIProvider,
  input: DungeonMasterPromptInput,
): Promise<ProviderActionResult> {
  if (provider === "openai") {
    const result = await processPlayerActionWithOpenAI(input);
    return {
      ...result,
      provider,
    };
  }

  const result = await processPlayerActionWithClaude(input);
  return {
    ...result,
    provider,
  };
}

function isAIProvider(value: string | undefined): value is AIProvider {
  return value === "claude" || value === "openai";
}
