import { Lightbulb } from "lucide-react";
import type { Room } from "@/lib/types";

interface HintPanelProps {
  room: Room;
  usedHintCount: number;
  disabled: boolean;
  onRequestHint: () => void;
}

export function HintPanel({
  room,
  usedHintCount,
  disabled,
  onRequestHint,
}: HintPanelProps) {
  const revealedHints = room.puzzle.hintLevels.slice(0, usedHintCount);
  const remaining = Math.max(room.puzzle.hintLevels.length - usedHintCount, 0);

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">
          <Lightbulb className="h-4 w-4" />
          Hints
        </div>
        <span className="text-xs text-slate-400">{remaining} left</span>
      </div>
      <div className="mt-3 grid gap-2">
        {revealedHints.length > 0 ? (
          revealedHints.map((hint, index) => (
            <p
              key={`${room.puzzle.id}-${index}`}
              className="rounded-lg border border-teal-300/15 bg-teal-300/10 p-3 text-sm leading-6 text-teal-50"
            >
              {hint}
            </p>
          ))
        ) : (
          <p className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400">
            No hints revealed yet.
          </p>
        )}
        <button
          type="button"
          onClick={onRequestHint}
          disabled={disabled || remaining === 0}
          className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Lightbulb className="h-4 w-4" />
          Reveal hint
        </button>
      </div>
    </section>
  );
}
