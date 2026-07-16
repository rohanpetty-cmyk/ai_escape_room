"use client";

import { RefreshCcw, ShieldCheck } from "lucide-react";
import type { GameDefinition, GameState } from "@/lib/game/types";

interface VictoryScreenProps {
  game: GameDefinition;
  state: GameState;
  onReset: () => void;
}

export function VictoryScreen({ game, state, onReset }: VictoryScreenProps) {
  const minutes = state.completedAt
    ? Math.max(1, Math.round((state.completedAt - state.startedAt) / 60000))
    : 1;

  return (
    <section className="fixed inset-0 z-20 grid place-items-center bg-[#080a07]/86 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-lg border border-[#d7ff68]/30 bg-[#151711] p-6 text-center shadow-2xl shadow-black/50 sm:p-8">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#d7ff68] text-[#10130f]">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d7ff68]">
          Escape complete
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-[#f5f1e8]">
          {game.title}
        </h2>
        <p className="mt-4 text-base leading-7 text-[#d8d3c6]">
          {game.finalEscape.victoryText}
        </p>
        <p className="mt-4 text-sm text-[#a9a292]">
          Solved in about {minutes} minute{minutes === 1 ? "" : "s"}.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#d7ff68] px-5 text-sm font-semibold text-[#10130f] transition hover:bg-[#e5ff94]"
        >
          <RefreshCcw className="h-4 w-4" />
          New escape
        </button>
      </div>
    </section>
  );
}
