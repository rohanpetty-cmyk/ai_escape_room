import { Check, LockKeyhole, RadioTower } from "lucide-react";
import type { GameState } from "@/lib/types";

interface ProgressMapProps {
  currentRoomId: string;
  rooms: GameState["rooms"];
  solvedPuzzleIds: string[];
}

export function ProgressMap({
  currentRoomId,
  rooms,
  solvedPuzzleIds,
}: ProgressMapProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/80 px-4 py-3 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
          <RadioTower className="h-4 w-4" />
          Escape route
        </div>
        <span className="text-xs text-slate-400">
          {solvedPuzzleIds.length}/{rooms.length} secured
        </span>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(128px,1fr))] gap-2">
        {rooms.map((room, index) => {
          const active = room.id === currentRoomId;
          const solved =
            room.puzzle.solved || solvedPuzzleIds.includes(room.puzzle.id);
          const reachable = index === 0 || solvedPuzzleIds.length >= index;

          return (
            <div
              key={room.id}
              className={`relative overflow-hidden rounded-lg border px-3 py-2 transition ${
                active
                  ? "border-emerald-300/70 bg-emerald-300/15 shadow-[0_0_24px_rgba(52,211,153,0.18)]"
                  : solved
                    ? "border-teal-300/35 bg-teal-300/10"
                    : reachable
                      ? "border-purple-300/25 bg-purple-300/10"
                      : "border-white/10 bg-white/[0.025] opacity-70"
              }`}
            >
              {active ? (
                <div className="absolute inset-x-0 top-0 h-px animate-progress-sweep bg-emerald-200/80" />
              ) : null}
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border text-xs font-semibold ${
                    solved
                      ? "border-emerald-300/60 bg-emerald-300 text-slate-950"
                      : active
                        ? "border-emerald-300/60 bg-emerald-300/20 text-emerald-100"
                        : reachable
                          ? "border-purple-300/40 bg-purple-300/10 text-purple-100"
                          : "border-white/10 bg-white/[0.03] text-slate-500"
                  }`}
                >
                  {solved ? (
                    <Check className="h-4 w-4" />
                  ) : reachable ? (
                    index + 1
                  ) : (
                    <LockKeyhole className="h-3.5 w-3.5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {room.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {solved ? "Unlocked" : active ? "Current" : "Awaiting access"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
