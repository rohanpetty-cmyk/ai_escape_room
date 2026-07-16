"use client";

import { Terminal } from "lucide-react";
import type { GameLogEntry } from "@/lib/game/types";

interface GameLogProps {
  entries: GameLogEntry[];
}

const toneByType: Record<GameLogEntry["type"], string> = {
  user: "border-[#61d3c5]/25 text-[#b9f4ec]",
  system: "border-white/10 text-[#d8d3c6]",
  success: "border-[#d7ff68]/30 text-[#ecffd0]",
  hint: "border-[#ffd166]/30 text-[#ffe7a3]",
  error: "border-[#ff8a75]/30 text-[#ffc1b6]",
};

export function GameLog({ entries }: GameLogProps) {
  return (
    <aside className="rounded-lg border border-white/12 bg-[#151711] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#f5f1e8]">
        <Terminal className="h-4 w-4 text-[#d7ff68]" />
        Log
      </div>
      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {entries
          .slice()
          .reverse()
          .map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg border bg-[#0d100d] px-3 py-2 text-sm leading-6 ${toneByType[entry.type]}`}
            >
              {entry.type === "user" ? (
                <span className="mr-2 text-[#61d3c5]">&gt;</span>
              ) : null}
              {entry.text}
            </div>
          ))}
      </div>
    </aside>
  );
}
