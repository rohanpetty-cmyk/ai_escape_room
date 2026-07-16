"use client";

import { useMemo, useState } from "react";
import { Clock, RefreshCcw, ShieldAlert, Sparkles } from "lucide-react";
import { ActionInput } from "@/components/ActionInput";
import { GameLog } from "@/components/GameLog";
import { HintPanel } from "@/components/HintPanel";
import { InventoryPanel } from "@/components/InventoryPanel";
import { RoomView } from "@/components/RoomView";
import { ThemeForm } from "@/components/ThemeForm";
import { VictoryScreen } from "@/components/VictoryScreen";
import {
  executeAction,
  getCurrentRoom,
  getInventoryItems,
  parsePlayerActionText,
} from "@/lib/game/engine";
import type { GameDefinition, PlayerActionIntent } from "@/lib/game/types";
import { useGameStore } from "@/state/gameStore";

export function GameShell() {
  const { game, state, lastWarning, startDemo, setGame, setState, reset } =
    useGameStore();
  const [theme, setTheme] = useState("Escape from an abandoned AI laboratory");
  const [action, setAction] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const room = useMemo(() => {
    if (!game || !state) return undefined;
    return getCurrentRoom(game, state);
  }, [game, state]);

  async function generateGame() {
    if (!theme.trim()) {
      setError("Add a theme first.");
      return;
    }

    setIsGenerating(true);
    setError(undefined);

    try {
      const response = await fetch("/api/games/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });

      const payload = (await response.json()) as {
        game?: GameDefinition;
        warning?: string;
        error?: string;
      };

      if (!response.ok || !payload.game) {
        throw new Error(payload.error ?? "The room could not be generated.");
      }

      setGame(payload.game, payload.warning);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The room could not be generated.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function interpretAction(text: string): Promise<PlayerActionIntent> {
    if (!game || !state || !room) return parsePlayerActionText(text);

    try {
      const response = await fetch("/api/actions/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          visibleRoomSummary: [
            room.name,
            room.description,
            room.puzzle.prompt,
            room.clues.map((clue) => `${clue.label}: ${clue.text}`).join(" "),
          ].join(" "),
          inventoryNames: getInventoryItems(game, state).map((item) => item.name),
          availableExits: room.exits.map(
            (exit) => `${exit.direction} ${exit.label}`,
          ),
        }),
      });

      const payload = (await response.json()) as {
        intent?: PlayerActionIntent;
      };

      return payload.intent ?? parsePlayerActionText(text);
    } catch {
      return parsePlayerActionText(text);
    }
  }

  async function submitAction(text = action) {
    const raw = text.trim();
    if (!raw || !game || !state) return;

    setIsInterpreting(true);
    setAction("");

    const intent = await interpretAction(raw);
    const result = executeAction(game, state, intent, raw);
    setState(result.state);
    setIsInterpreting(false);
  }

  function requestHint() {
    if (!game || !state) return;
    const result = executeAction(
      game,
      state,
      { type: "hint", confidence: 1 },
      "hint",
    );
    setState(result.state);
  }

  if (!game || !state || !room) {
    return (
      <ThemeForm
        theme={theme}
        isGenerating={isGenerating}
        error={error}
        onThemeChange={setTheme}
        onGenerate={generateGame}
        onDemo={startDemo}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#0d100d] text-[#f5f1e8]">
      {state.status === "escaped" ? (
        <VictoryScreen game={game} state={state} onReset={reset} />
      ) : null}

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-lg border border-white/12 bg-[#151711] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#d7ff68]">
              <Sparkles className="h-3.5 w-3.5" />
              {game.mode === "demo" ? "Demo mode" : "Generated run"}
            </div>
            <h1 className="text-2xl font-semibold text-[#f5f1e8] sm:text-3xl">
              {game.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill icon={<Clock className="h-4 w-4" />}>
              {state.solvedPuzzleIds.length}/{game.rooms.length} solved
            </StatusPill>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/6 px-3 text-sm font-semibold text-[#f5f1e8] transition hover:bg-white/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </header>

        {lastWarning ? (
          <div className="flex items-start gap-3 rounded-lg border border-[#ffd166]/25 bg-[#ffd166]/10 px-4 py-3 text-sm leading-6 text-[#ffe7a3]">
            <ShieldAlert className="mt-1 h-4 w-4 shrink-0" />
            {lastWarning}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4">
            <RoomView room={room} state={state} onQuickAction={submitAction} />
            <ActionInput
              value={action}
              disabled={isInterpreting}
              onChange={setAction}
              onSubmit={() => submitAction()}
            />
          </div>

          <div className="grid content-start gap-4">
            <InventoryPanel
              game={game}
              state={state}
              onInspect={(itemName) => submitAction(`inspect ${itemName}`)}
            />
            <HintPanel room={room} state={state} onHint={requestHint} />
            <GameLog entries={state.log} />
          </div>
        </div>
      </div>
    </main>
  );
}

function StatusPill({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/12 bg-[#0d100d] px-3 text-sm text-[#d8d3c6]">
      {icon}
      {children}
    </span>
  );
}
