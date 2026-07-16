import type { NarrativeEntry } from "@/lib/types";

interface NarrativePanelProps {
  entries: NarrativeEntry[];
}

export function NarrativePanel({ entries }: NarrativePanelProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/80 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">
        Narrative
      </h2>
      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
        {entries
          .slice()
          .reverse()
          .map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm leading-6 text-slate-300"
            >
              {entry.speaker === "player" ? (
                <span className="mr-2 text-emerald-200">&gt;</span>
              ) : null}
              {entry.text}
            </div>
          ))}
      </div>
    </section>
  );
}
