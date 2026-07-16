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
  const progress = useAdventureStore((state) => state.progress);
  const resetGame = useAdventureStore((state) => state.resetGame);
  const submitCommand = useAdventureStore((state) => state.submitCommand);
  const requestCurrentHint = useAdventureStore((state) => state.requestCurrentHint);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsBooting(false), 450);
    return () => window.clearTimeout(timeout);
  }, []);

  const room = useMemo(() => getCurrentRoom(game, progress), [game, progress]);
  const inventory = useMemo(() => getInventory(game, progress), [game, progress]);
  const solved = isPuzzleSolved(room, progress);

  if (isBooting) {
    return <LoadingSequence />;
  }

  return (
    <main className="min-h-screen bg-[#080b12] px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      {progress.status === "escaped" ? (
        <VictoryScreen
          title={game.title}
          text={game.victoryText}
          onReset={resetGame}
        />
      ) : null}

      <div className="mx-auto grid w-full max-w-7xl gap-5">
        <GameHeader
          title={game.title}
          currentRoomName={room.name}
          solvedCount={progress.solvedPuzzleIds.length}
          totalRooms={game.rooms.length}
          onReset={resetGame}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4">
            <RoomVisual room={room} />
            <CommandInput
              disabled={progress.status === "escaped"}
              onSubmit={submitCommand}
            />
            <NarrativePanel entries={progress.narrative} />
          </div>

          <aside className="grid content-start gap-4">
            <ObjectivesPanel room={room} solved={solved} />
            <InventoryPanel items={inventory} />
            <HintPanel
              room={room}
              usedHintCount={progress.usedHintsByPuzzleId[room.puzzle.id] ?? 0}
              disabled={solved || progress.status === "escaped"}
              onRequestHint={requestCurrentHint}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
