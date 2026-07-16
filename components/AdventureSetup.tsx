"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Loader2,
  Play,
  Sparkles,
  Wand2,
} from "lucide-react";
import { ProviderSelector } from "@/components/ProviderSelector";
import { gameStateSchema } from "@/lib/schemas";
import { demoGame, sampleGame } from "@/lib/sample-game";
import { useAdventureStore } from "@/state/adventureStore";

type Difficulty = "easy" | "medium" | "hard";

const difficulties: Array<{
  id: Difficulty;
  label: string;
}> = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

const agentSteps = [
  "Story Agent shaping the mission",
  "Puzzle Agent placing fair clues",
  "Dungeon Master validating state",
  "Hint Agent calibrating reveals",
];

export function AdventureSetup() {
  const aiProvider = useAdventureStore((state) => state.aiProvider);
  const setAIProvider = useAdventureStore((state) => state.setAIProvider);
  const startGeneratedGame = useAdventureStore((state) => state.startGeneratedGame);
  const startSampleGame = useAdventureStore((state) => state.startSampleGame);
  const startDemoGame = useAdventureStore((state) => state.startDemoGame);
  const [theme, setTheme] = useState(
    "Escape from an abandoned AI laboratory during a midnight systems failure",
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [demoMode, setDemoMode] = useState(false);
  const [sourceMaterial, setSourceMaterial] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGenerating) return;

    const interval = window.setInterval(() => {
      setActiveAgentIndex((index) => (index + 1) % agentSteps.length);
    }, 900);

    return () => window.clearInterval(interval);
  }, [isGenerating]);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTheme = theme.trim();
    if (!cleanTheme || isGenerating) return;

    setIsGenerating(true);
    setActiveAgentIndex(0);
    setGenerationError(null);

    try {
      const response = await fetch("/api/generate-game", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          theme: cleanTheme,
          difficulty,
          demoMode,
          provider: aiProvider,
          sourceMaterial: sourceMaterial.trim() || undefined,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getGenerationErrorMessage(payload));
      }

      const game = getGameFromPayload(payload);
      startGeneratedGame(game);
      window.location.href = "/game";
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "The AI agents could not generate an adventure.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function playSample() {
    startSampleGame();
    window.location.href = "/game?mode=sample";
  }

  function playDemo() {
    startDemoGame();
    window.location.href = "/game?mode=demo";
  }

  return (
    <main className="min-h-screen bg-[#080b12] text-slate-100">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <form
          onSubmit={handleGenerate}
          className="grid content-start gap-5 rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-black/25"
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-200">
              <Wand2 className="h-4 w-4" />
              AI Escape Room
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
              Generate a playable escape room
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Give the agents a theme, then step directly into a generated
              room set with clues, puzzles, inventory, and a deterministic game
              engine behind the curtain.
            </p>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-emerald-100">Theme</span>
            <textarea
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              disabled={isGenerating}
              maxLength={180}
              className="min-h-24 resize-none rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 disabled:opacity-60"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-teal-100">Provider</span>
              <ProviderSelector provider={aiProvider} onChange={setAIProvider} />
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-teal-100">Difficulty</span>
              <div className="inline-flex h-10 rounded-lg border border-white/10 bg-white/[0.035] p-1">
                {difficulties.map((candidate) => {
                  const active = candidate.id === difficulty;

                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => setDifficulty(candidate.id)}
                      disabled={isGenerating}
                      className={`h-8 rounded-md px-3 text-xs font-semibold transition ${
                        active
                          ? "bg-teal-300 text-slate-950"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {candidate.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDemoMode(false)}
              disabled={isGenerating}
              className={`h-10 rounded-lg px-4 text-sm font-semibold transition ${
                !demoMode
                  ? "bg-purple-300 text-slate-950"
                  : "border border-purple-300/25 bg-purple-300/10 text-purple-100"
              }`}
            >
              Full run
            </button>
            <button
              type="button"
              onClick={() => setDemoMode(true)}
              disabled={isGenerating}
              className={`h-10 rounded-lg px-4 text-sm font-semibold transition ${
                demoMode
                  ? "bg-purple-300 text-slate-950"
                  : "border border-purple-300/25 bg-purple-300/10 text-purple-100"
              }`}
            >
              Quick demo
            </button>
          </div>

          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-purple-100">
              <BookOpen className="h-4 w-4" />
              Educational source
            </span>
            <textarea
              value={sourceMaterial}
              onChange={(event) => setSourceMaterial(event.target.value)}
              disabled={isGenerating}
              maxLength={6000}
              placeholder="Paste policy, handbook, Scrum Guide notes, or leave blank."
              className="min-h-28 resize-none rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-purple-300/60 disabled:opacity-60"
            />
          </label>

          {isGenerating ? (
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
              <div className="flex items-center gap-3 text-sm font-semibold text-emerald-100">
                <Loader2 className="h-4 w-4 animate-spin" />
                Agents at work
              </div>
              <div className="mt-3 grid gap-2">
                {agentSteps.map((step, index) => (
                  <div
                    key={step}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      index === activeAgentIndex
                        ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-50"
                        : "border-white/10 bg-white/[0.035] text-slate-400"
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {generationError ? (
            <p className="flex items-start gap-2 rounded-lg border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-sm leading-6 text-rose-100">
              <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
              <span>{generationError}</span>
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isGenerating || !theme.trim()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate adventure
            </button>
            <button
              type="button"
              onClick={playSample}
              disabled={isGenerating}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-teal-300/25 bg-teal-300/10 px-5 text-sm font-semibold text-teal-100 transition hover:bg-teal-300/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Sample
            </button>
            <button
              type="button"
              onClick={playDemo}
              disabled={isGenerating}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-purple-300/25 bg-purple-300/10 px-5 text-sm font-semibold text-purple-100 transition hover:bg-purple-300/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Demo
            </button>
          </div>
        </form>

        <aside className="grid content-start gap-4">
          <section className="relative overflow-hidden rounded-lg border border-teal-300/20 bg-slate-950 p-5 shadow-2xl shadow-purple-950/30">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(45,212,191,0.16),transparent_42%),linear-gradient(315deg,rgba(168,85,247,0.16),transparent_46%)]" />
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.22em] text-teal-200">
                Ready fallback
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                {sampleGame.title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                {sampleGame.openingMission}
              </p>
            </div>
          </section>

          <section className="grid gap-3">
            {sampleGame.rooms.map((room, index) => (
              <div
                key={room.id}
                className="rounded-lg border border-white/10 bg-slate-950/80 p-4"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">
                  Room {index + 1}
                </div>
                <div className="mt-1 font-medium text-white">{room.name}</div>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {sampleGame.objectives[index]?.text ?? room.puzzle.prompt}
                </p>
              </div>
            ))}
            <div className="rounded-lg border border-purple-300/20 bg-purple-300/10 p-4 text-sm font-semibold text-purple-100">
              {sampleGame.rooms.length} rooms + {demoGame.rooms.length} demo mode
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function getGameFromPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("game" in payload)) {
    throw new Error("The AI agents returned an unexpected response.");
  }

  const parsed = gameStateSchema.safeParse(payload.game);

  if (!parsed.success) {
    throw new Error("The generated adventure did not match the game schema.");
  }

  return parsed.data;
}

function getGenerationErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return "The AI agents could not generate an adventure.";
  }

  const error = payload.error;

  if (!error || typeof error !== "object" || !("message" in error)) {
    return "The AI agents could not generate an adventure.";
  }

  const message = error.message;

  return typeof message === "string"
    ? message
    : "The AI agents could not generate an adventure.";
}
