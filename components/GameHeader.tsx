/* eslint-disable @next/next/no-html-link-for-pages -- Vinext dev server fails to proxy next/link in client RSC modules. */
import { RotateCcw, Shield } from "lucide-react";

interface GameHeaderProps {
  title: string;
  currentRoomName: string;
  solvedCount: number;
  totalRooms: number;
  onReset: () => void;
}

export function GameHeader({
  title,
  currentRoomName,
  solvedCount,
  totalRooms,
  onReset,
}: GameHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-lg border border-white/10 bg-slate-950/80 p-4 shadow-xl shadow-black/20 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-200">
          <Shield className="h-3.5 w-3.5" />
          {solvedCount}/{totalRooms} locks solved
        </div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{currentRoomName}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-teal-300/20 bg-teal-300/10 px-4 text-sm font-semibold text-teal-100 transition hover:bg-teal-300/15"
        >
          Setup
        </a>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-purple-300/25 bg-purple-300/10 px-4 text-sm font-semibold text-purple-100 transition hover:bg-purple-300/15"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
    </header>
  );
}
