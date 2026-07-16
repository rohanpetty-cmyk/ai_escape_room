import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-3-5-sonnet-latest";

export function hasAnthropicApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function askClaude(prompt: string, maxTokens = 2400) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    max_tokens: maxTokens,
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}
