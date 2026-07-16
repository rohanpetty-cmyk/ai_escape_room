"use client";

import { Lightbulb } from "lucide-react";
import { isPuzzleSolved } from "@/lib/game/engine";
import type { GameState, Room } from "@/lib/game/types";

interface HintPanelProps {
  room: Room;
  state: GameState;
  onHint: () => void;
}

export function HintPanel({ room, state, onHint }: HintPanelProps) {
  const solved = isPuzzleSolved(room.puzzle, state);
  const used = state.usedHintCountsByPuzzleId[room.puzzle.id] ?? 0;
  const revealed = room.puzzle.hints.slice(0, used);
  const remaining = Math.max(room.puzzle.hints.length - used, 0);

  return (
    <aside className="rounded-lg border border-white/12 bg-[#151711] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#f5f1e8]">
          <Lightbulb className="h-4 w-4 text-[#d7ff68]" />
          Hints
        </div>
        <span className="text-xs text-[#a9a292]">{remaining} left</span>
      </div>
      <div className="grid gap-2">
        {revealed.length ? (
          revealed.map((hint, index) => (
            <p
              key={`${room.puzzle.id}-${index}`}
              className="rounded-lg border border-[#d7ff68]/18 bg-[#d7ff68]/8 px-3 py-3 text-sm leading-6 text-[#eee8d8]"
            >
              {hint.text}
            </p>
          ))
        ) : (
          <p className="rounded-lg border border-white/8 px-3 py-3 text-sm text-[#8f8a7d]">
            None revealed
          </p>
        )}
        <button
          type="button"
          onClick={onHint}
          disabled={solved || remaining === 0}
          className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/6 px-3 text-sm font-semibold text-[#f5f1e8] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Lightbulb className="h-4 w-4" />
          Hint
        </button>
      </div>
    </aside>
  );
}
