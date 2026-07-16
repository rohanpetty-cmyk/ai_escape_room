"use client";

import { useEffect, useMemo, useState } from "react";
import { CommandInput } from "@/components/CommandInput";
import { GameHeader } from "@/components/GameHeader";
import { HintPanel } from "@/components/HintPanel";
import { InventoryPanel } from "@/components/InventoryPanel";
import { LoadingSequence } from "@/components/LoadingSequence";
import { NarrativePanel } from "@/components/NarrativePanel";
import { ObjectivesPanel } from "@/components/ObjectivesPanel";
import { RoomVisual } from "@/components/RoomVisual";
import { VictoryScreen } from "@/components/VictoryScreen";
import {
  getCurrentRoom,
  getInventory,
  isPuzzleSolved,
} from "@/lib/game-engine";
import { useAdventureStore } from "@/state/adventureStore";

export default function GamePage() {
  const game = useAdventureStore((state) => state.game);
  const resetGame = useAdventureStore((state) => state.resetGame);
  const startSampleGame = useAdventureStore((state) => state.startSampleGame);
  const startDemoGame = useAdventureStore((state) => state.startDemoGame);
  const submitCommand = useAdventureStore((state) => state.submitCommand);
  const requestCurrentHint = useAdventureStore((state) => state.requestCurrentHint);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get("mode");
    if (mode === "demo") {
      startDemoGame();
    } else if (mode === "sample") {
      startSampleGame();
    }

    const timeout = window.setTimeout(() => setIsBooting(false), 450);
    return () => window.clearTimeout(timeout);
  }, [startDemoGame, startSampleGame]);

  const room = useMemo(() => getCurrentRoom(game), [game]);
  const inventory = useMemo(() => getInventory(game), [game]);
  const solved = isPuzzleSolved(room, game);
  const victoryText =
    game.narrativeHistory.at(-1)?.content ??
    "The final exit opens and the escape room falls silent.";

  if (isBooting) {
    return <LoadingSequence />;
  }

  return (
    <main className="min-h-screen bg-[#080b12] px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      {game.status === "escaped" ? (
        <VictoryScreen
          title={game.title}
          text={victoryText}
          onReset={resetGame}
        />
      ) : null}

      <div className="mx-auto grid w-full max-w-7xl gap-5">
        <GameHeader
          title={game.title}
          currentRoomName={room.name}
          solvedCount={game.solvedPuzzleIds.length}
          totalRooms={game.rooms.length}
          onReset={resetGame}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4">
            <RoomVisual room={room} />
            <CommandInput
              disabled={game.status === "escaped"}
              onSubmit={submitCommand}
            />
            <NarrativePanel entries={game.narrativeHistory} />
          </div>

          <aside className="grid content-start gap-4">
            <ObjectivesPanel
              objectives={game.objectives}
              currentRoomId={room.id}
              room={room}
              solved={solved}
            />
            <InventoryPanel items={inventory} />
            <HintPanel
              room={room}
              usedHintCount={game.hintsUsed[room.puzzle.id] ?? 0}
              disabled={solved || game.status === "escaped"}
              onRequestHint={requestCurrentHint}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
