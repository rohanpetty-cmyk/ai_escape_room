"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionFeedback,
  type ActionFeedbackState,
  type ActionFeedbackTone,
} from "@/components/ActionFeedback";
import { CommandInput } from "@/components/CommandInput";
import { GameHeader } from "@/components/GameHeader";
import { HintPanel } from "@/components/HintPanel";
import { InventoryPanel } from "@/components/InventoryPanel";
import { LoadingSequence } from "@/components/LoadingSequence";
import { NarrativePanel } from "@/components/NarrativePanel";
import { ProgressMap } from "@/components/ProgressMap";
import { ObjectivesPanel } from "@/components/ObjectivesPanel";
import { RoomVisual } from "@/components/RoomVisual";
import { RoomTransitionOverlay } from "@/components/RoomTransitionOverlay";
import { ThemeArtifact } from "@/components/ThemeArtifact";
import { VictoryScreen } from "@/components/VictoryScreen";
import {
  getCurrentRoom,
  getInventory,
  isPuzzleSolved,
} from "@/lib/game-engine";
import type { PlayerActionResult } from "@/lib/types";
import { useAdventureStore } from "@/state/adventureStore";

export default function GamePage() {
  const aiProvider = useAdventureStore((state) => state.aiProvider);
  const game = useAdventureStore((state) => state.game);
  const setAIProvider = useAdventureStore((state) => state.setAIProvider);
  const resetGame = useAdventureStore((state) => state.resetGame);
  const startSampleGame = useAdventureStore((state) => state.startSampleGame);
  const startDemoGame = useAdventureStore((state) => state.startDemoGame);
  const submitCommand = useAdventureStore((state) => state.submitCommand);
  const requestCurrentHint = useAdventureStore((state) => state.requestCurrentHint);
  const [isBooting, setIsBooting] = useState(true);
  const [isSubmittingCommand, setIsSubmittingCommand] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedbackState | null>(null);
  const [newInventoryItemIds, setNewInventoryItemIds] = useState<string[]>([]);
  const [roomTransition, setRoomTransition] = useState<{
    fromRoomName: string;
    toRoomName: string;
  } | null>(null);
  const previousRoomRef = useRef<{ id: string; name: string } | null>(null);
  const previousInventoryIdsRef = useRef<Set<string> | null>(null);
  const previousSolvedPuzzleIdsRef = useRef<Set<string> | null>(null);
  const roomTransitionTimeoutRef = useRef<number | null>(null);

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

  function showRoomTransition(fromRoomName: string, toRoomName: string) {
    if (roomTransitionTimeoutRef.current) {
      window.clearTimeout(roomTransitionTimeoutRef.current);
    }

    setRoomTransition({ fromRoomName, toRoomName });
    roomTransitionTimeoutRef.current = window.setTimeout(() => {
      setRoomTransition(null);
      roomTransitionTimeoutRef.current = null;
    }, 4800);
  }

  useEffect(() => {
    if (isBooting) {
      previousRoomRef.current = { id: room.id, name: room.name };
      return;
    }

    const previousRoom = previousRoomRef.current;
    if (previousRoom && previousRoom.id !== room.id) {
      showRoomTransition(previousRoom.name, room.name);
      previousRoomRef.current = { id: room.id, name: room.name };
      return;
    }

    previousRoomRef.current = { id: room.id, name: room.name };
  }, [isBooting, room.id, room.name]);

  useEffect(() => {
    const currentInventoryIds = new Set(inventory.map((item) => item.id));
    const previousInventoryIds = previousInventoryIdsRef.current;

    if (previousInventoryIds) {
      const nextNewItemIds = [...currentInventoryIds].filter(
        (itemId) => !previousInventoryIds.has(itemId),
      );

      if (nextNewItemIds.length > 0) {
        setNewInventoryItemIds(nextNewItemIds);
        const timeout = window.setTimeout(() => setNewInventoryItemIds([]), 1800);
        previousInventoryIdsRef.current = currentInventoryIds;

        return () => window.clearTimeout(timeout);
      }
    }

    previousInventoryIdsRef.current = currentInventoryIds;
  }, [inventory]);

  useEffect(() => {
    if (!feedback) return;

    const timeout = window.setTimeout(() => setFeedback(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    return () => {
      if (roomTransitionTimeoutRef.current) {
        window.clearTimeout(roomTransitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const currentSolvedIds = new Set(game.solvedPuzzleIds);
    const previousSolvedIds = previousSolvedPuzzleIdsRef.current;

    if (previousSolvedIds) {
      const newSolvedPuzzleId = [...currentSolvedIds].find(
        (puzzleId) => !previousSolvedIds.has(puzzleId),
      );
      const solvedRoom = game.rooms.find(
        (candidate) => candidate.puzzle.id === newSolvedPuzzleId,
      );

      if (solvedRoom) {
        setFeedback({
          tone: "success",
          title: "Access granted",
          message: solvedRoom.puzzle.successMessage,
        });
      }
    }

    previousSolvedPuzzleIdsRef.current = currentSolvedIds;
  }, [game.rooms, game.solvedPuzzleIds]);

  async function handleSubmitCommand(command: string) {
    setCommandError(null);
    setIsSubmittingCommand(true);

    try {
      const result = await submitCommand(command);
      setFeedback(feedbackFromActionResult(result));
      const moveEffect = result.effects.find((effect) => effect.type === "MOVE_ROOM");
      const destinationRoom = moveEffect
        ? game.rooms.find((candidate) => candidate.id === moveEffect.roomId)
        : undefined;

      if (destinationRoom && destinationRoom.id !== room.id) {
        showRoomTransition(room.name, destinationRoom.name);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The Dungeon Master could not process that action.";

      setCommandError(message);
      throw error;
    } finally {
      setIsSubmittingCommand(false);
    }
  }

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
          provider={aiProvider}
          onProviderChange={setAIProvider}
          onReset={resetGame}
        />
        <ProgressMap
          currentRoomId={room.id}
          rooms={game.rooms}
          solvedPuzzleIds={game.solvedPuzzleIds}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4">
            <RoomVisual room={room} feedbackTone={feedback?.tone ?? null} />
            <ThemeArtifact
              room={room}
              theme={game.theme}
              discoveredClueIds={game.discoveredClueIds}
              inventory={inventory}
              solved={solved}
            />
            <ActionFeedback feedback={feedback} />
            <CommandInput
              disabled={game.status === "escaped"}
              error={commandError}
              loading={isSubmittingCommand}
              onSubmit={handleSubmitCommand}
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
            <InventoryPanel
              items={inventory}
              newItemIds={newInventoryItemIds}
            />
            <HintPanel
              room={room}
              usedHintCount={game.hintsUsed[room.puzzle.id] ?? 0}
              disabled={solved || game.status === "escaped"}
              onRequestHint={requestCurrentHint}
            />
          </aside>
        </div>
      </div>
      {roomTransition ? (
        <RoomTransitionOverlay
          fromRoomName={roomTransition.fromRoomName}
          toRoomName={roomTransition.toRoomName}
          visualTheme={room.visualTheme}
        />
      ) : null}
    </main>
  );
}

function feedbackFromActionResult(
  result: PlayerActionResult,
): ActionFeedbackState | null {
  const tone = feedbackToneFromActionResult(result);

  if (!tone) return null;

  if (tone === "success") {
    return {
      tone,
      title: result.effects.some((effect) => effect.type === "ESCAPE")
        ? "Escape route open"
        : "Access granted",
      message: result.narration,
    };
  }

  return {
    tone,
    title: "Access denied",
    message: result.narration,
  };
}

function feedbackToneFromActionResult(
  result: PlayerActionResult,
): ActionFeedbackTone | null {
  if (
    result.effects.some(
      (effect) => effect.type === "SOLVE_PUZZLE" || effect.type === "ESCAPE",
    )
  ) {
    return "success";
  }

  if (result.intent === "ANSWER" && result.valid) {
    return "success";
  }

  if (result.intent === "ANSWER" && !result.valid) {
    return "failure";
  }

  return null;
}
