import Anthropic from "@anthropic-ai/sdk";

export interface ClaudePlaceholderStatus {
  configured: boolean;
  message: string;
}

export function getClaudePlaceholderStatus(): ClaudePlaceholderStatus {
  return {
    configured: Boolean(process.env.ANTHROPIC_API_KEY),
    message:
      "Claude is installed but not connected yet. Static sample game mode is active.",
  };
}

export function createClaudeClientPlaceholder(): Anthropic | null {
  return null;
}
