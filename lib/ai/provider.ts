import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type AiProvider = "openai" | "anthropic";

const DEFAULT_ANTHROPIC_MODEL = "claude-3-5-sonnet-latest";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

function configuredProviderPreference() {
  const provider = process.env.AI_PROVIDER?.toLowerCase().trim();

  if (provider === "claude") return "anthropic";
  if (provider === "anthropic" || provider === "openai") return provider;

  return "auto";
}

export function getConfiguredAiProvider(): AiProvider | null {
  const preference = configuredProviderPreference();

  if (preference === "openai") {
    return process.env.OPENAI_API_KEY ? "openai" : null;
  }

  if (preference === "anthropic") {
    return process.env.ANTHROPIC_API_KEY ? "anthropic" : null;
  }

  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";

  return null;
}

export async function askAi(prompt: string, maxTokens = 2400) {
  const provider = getConfiguredAiProvider();

  if (provider === "openai") {
    return askOpenAI(prompt, maxTokens);
  }

  if (provider === "anthropic") {
    return askAnthropic(prompt, maxTokens);
  }

  return null;
}

async function askOpenAI(prompt: string, maxTokens: number) {
  if (!process.env.OPENAI_API_KEY) return null;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL,
    input: prompt,
    max_output_tokens: maxTokens,
  });

  return extractOpenAIText(response);
}

async function askAnthropic(prompt: string, maxTokens: number) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL,
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

function extractOpenAIText(response: Awaited<ReturnType<OpenAI["responses"]["create"]>>) {
  if ("output_text" in response && typeof response.output_text === "string") {
    return response.output_text.trim();
  }

  return response.output
    .flatMap((item) => ("content" in item ? item.content : []))
    .map((content) => {
      if ("text" in content && typeof content.text === "string") {
        return content.text;
      }
      return "";
    })
    .join("\n")
    .trim();
}
