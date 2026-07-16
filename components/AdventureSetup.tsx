import Link from "next/link";
import { Cpu, Play, Sparkles } from "lucide-react";
import { sampleGame } from "@/lib/sample-game";

export function AdventureSetup() {
  return (
    <main className="min-h-screen bg-[#080b12] text-slate-100">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-5 py-10 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-200">
            <Cpu className="h-4 w-4" />
            Static scaffold mode
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-white md:text-7xl">
            AI Escape Room
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Enter a cinematic lab escape built from a static sample game. Claude
            hooks are scaffolded but intentionally not connected yet.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/game"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
            >
              <Play className="h-4 w-4" />
              Start sample game
            </Link>
            <div className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-purple-300/25 bg-purple-300/10 px-5 text-sm font-semibold text-purple-100">
              <Sparkles className="h-4 w-4" />
              {sampleGame.rooms.length} connected rooms
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-teal-300/20 bg-slate-950 p-6 shadow-2xl shadow-purple-950/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.18),transparent_35%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.2),transparent_28%),radial-gradient(circle_at_55%_85%,rgba(16,185,129,0.18),transparent_35%)]" />
          <div className="relative">
            <p className="text-sm uppercase tracking-[0.22em] text-teal-200">
              Mission
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {sampleGame.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              {sampleGame.openingMission}
            </p>
            <div className="mt-8 grid gap-3">
              {sampleGame.rooms.map((room, index) => (
                <div
                  key={room.id}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">
                    Room {index + 1}
                  </div>
                  <div className="mt-1 font-medium text-white">{room.name}</div>
                  <p className="mt-1 text-sm text-slate-400">{room.objective}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
