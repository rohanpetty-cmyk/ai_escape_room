import { Bot, Sparkles } from "lucide-react";
import type { AIProvider } from "@/lib/types";

interface ProviderSelectorProps {
  provider: AIProvider;
  onChange: (provider: AIProvider) => void;
}

const providers: Array<{
  id: AIProvider;
  label: string;
}> = [
  {
    id: "claude",
    label: "Claude",
  },
  {
    id: "openai",
    label: "OpenAI",
  },
];

export function ProviderSelector({ provider, onChange }: ProviderSelectorProps) {
  return (
    <div className="inline-flex h-10 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.035] p-1">
      <Bot className="ml-2 h-4 w-4 text-teal-200" />
      {providers.map((candidate) => {
        const active = candidate.id === provider;

        return (
          <button
            key={candidate.id}
            type="button"
            onClick={() => onChange(candidate.id)}
            className={`inline-flex h-8 items-center justify-center gap-1 rounded-md px-3 text-xs font-semibold transition ${
              active
                ? "bg-emerald-300 text-slate-950"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
            aria-pressed={active}
          >
            {candidate.id === "openai" ? <Sparkles className="h-3.5 w-3.5" /> : null}
            {candidate.label}
          </button>
        );
      })}
    </div>
  );
}
